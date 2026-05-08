import { promises as fs } from "fs";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

type SeederModule = {
	title?: string;
	description?: string;
	seeder?: () => Promise<void>;
	default?: {
		title?: string;
		description?: string;
		seeder?: () => Promise<void>;
	};
};

type LoadedSeeder = {
	fileName: string;
	title: string;
	description?: string;
	run: () => Promise<void>;
};

const seedersDirectory = path.join(__dirname, "seeders-files");

const isSeederFile = (fileName: string): boolean => {
	const extension = path.extname(fileName);
	return [".ts", ".js"].includes(extension) && !fileName.endsWith(".d.ts");
};

const loadSeeders = async (): Promise<LoadedSeeder[]> => {
	const files = await fs.readdir(seedersDirectory);
	const seederFiles = files.filter(isSeederFile).sort();

	const seeders = seederFiles.map((fileName) => {
		const modulePath = path.join(seedersDirectory, fileName);
		const seederModule = require(modulePath) as SeederModule;
		const moduleContent = seederModule.default ?? seederModule;

		if (typeof moduleContent.seeder !== "function") {
			throw new Error(
				`El seeder ${fileName} no exporta una funcion 'seeder' valida`,
			);
		}

		return {
			fileName,
			title: moduleContent.title ?? fileName,
			description: moduleContent.description,
			run: moduleContent.seeder,
		} satisfies LoadedSeeder;
	});

	return seeders;
};

const printMenu = (seeders: LoadedSeeder[]): void => {
	console.log("\n========================================");
	console.log("Menu de seeders");
	console.log("========================================");
	console.log("0. Continuar sin correr seeders");

	seeders.forEach((seeder, index) => {
		console.log(`${index + 1}. ${seeder.title}`);
		if (seeder.description) {
			console.log(`   ${seeder.description}`);
		}
		console.log(`   Archivo: ${seeder.fileName}`);
	});
};

const runSeederMenu = async (): Promise<void> => {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		return;
	}

	let seeders: LoadedSeeder[] = [];

	try {
		seeders = await loadSeeders();
	} catch (error) {
		console.error("No se pudieron cargar los seeders:", error);
		return;
	}

	if (seeders.length === 0) {
		console.log("No hay seeders disponibles en src/config/seeders/seeders-files");
		return;
	}

	const rl = createInterface({ input, output });

	try {
		while (true) {
			printMenu(seeders);

			const answer = await rl.question(
				"Selecciona un seeder por numero y presiona Enter: ",
			);
			const selectedOption = Number.parseInt(answer.trim(), 10);

			if (Number.isNaN(selectedOption)) {
				console.log("Opcion invalida. Intenta nuevamente.");
				continue;
			}

			if (selectedOption === 0) {
				console.log("Continuando sin ejecutar seeders.\n");
				break;
			}

			const selectedSeeder = seeders[selectedOption - 1];
			if (!selectedSeeder) {
				console.log("La opcion seleccionada no existe.");
				continue;
			}

			console.log(`\nEjecutando seeder: ${selectedSeeder.title}`);

			try {
				await selectedSeeder.run();
				console.log(`Seeder completado: ${selectedSeeder.title}\n`);
			} catch (error) {
				console.error(`Error ejecutando ${selectedSeeder.title}:`, error);
			}
		}
	} finally {
		rl.close();
	}
};

export default runSeederMenu;
