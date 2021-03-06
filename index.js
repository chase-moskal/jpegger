#!/usr/bin/env node

const path = require("path")
const sharp = require("sharp")
const shell = require("shelljs")
const glob = require("fast-glob")
const commander = require("commander")
const {dieOnError} = require("die-on-error")

dieOnError()
main()

async function main() {

	//
	// collect arguments
	//

	commander
		.version("0.0.0-dev.0")
		.option("-i, --indir [globs]", "input directory containing images")
		.option("-o, --outdir [dir]", "output directory")
		.option("-q, --quality [number]", "jpeg quality", 75)
		.option("-s, --size [number]", "maximum width and height", null)
		.parse(process.argv)

	//
	// argument validation and error handling
	//

	for (const arg of ["indir", "outdir"])
		if (!commander[arg])
			throw new Error(`argument "${arg}" is required`)

	//
	// get to work
	//

	const {indir, outdir, quality: rawQuality, size: rawSize} = commander
	const quality = parseInt(rawQuality)
	const size = parseInt(rawSize)

	const inputImages = await glob("**/*.{jpg,jpeg,png}", {
		cwd: path.resolve(indir)
	})

	await Promise.all(inputImages.map(async inputImage => {
		const inputParse = path.parse(inputImage)
		const outPath = path.resolve(outdir, inputParse.dir, inputParse.name + ".jpg")
		shell.mkdir("-p", path.parse(outPath).dir)
		let s = await sharp(path.resolve(indir, inputImage))
		if (size !== null) s = s.resize({width: size, height: size, fit: "inside", withoutEnlargement: true})
		s
			.jpeg({quality, progressive: true})
			.toFile(outPath)
	}))
}
