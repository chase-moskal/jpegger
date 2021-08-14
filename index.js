#!/usr/bin/env node

const path = require("path")
const sharp = require("sharp")
const shell = require("shelljs")
const glob = require("fast-glob")
const {program} = require("commander")
const {dieOnError} = require("die-on-error")

dieOnError()
main()

async function main() {

	//
	// collect arguments
	//

	program
		.option("-i, --indir [globs]", "input directory containing images")
		.option("-o, --outdir [dir]", "output directory")
		.option("-q, --quality [number]", "jpeg quality", 75)
		.option("-s, --size [number]", "maximum width and height", null)
	program.parse(process.argv)

	//
	// argument validation and error handling
	//

	const options = program.opts()

	for (const arg of ["indir", "outdir"])
		if (!options[arg])
			throw new Error(`argument "${arg}" is required`)

	//
	// get to work
	//

	const {indir, outdir, quality: rawQuality, size: rawSize} = options
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
		s = s.rotate()
		if (size !== null) s = s.resize({width: size, height: size, fit: "inside", withoutEnlargement: true})
		s
			.jpeg({quality, progressive: true})
			.toFile(outPath)
	}))
}
