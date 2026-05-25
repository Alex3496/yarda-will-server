import { Types } from "mongoose";
import Auction from "../../../models/auction.model";
import Client from "../../../models/clients.model";
import Contact from "../../../models/contact.model";
import Operation from "../../../models/operations.model";
import OperationService from "../../../models/operations_services.model";
import Service from "../../../models/service.model";
import VehicleModel from "../../../models/vehicleModel.model";

export const title = "Operaciones de demostracion";
export const description =
	"Crea 500 operaciones y registros relacionados en operation services con folio de 6 digitos";

type EntityWithId = {
	_id: Types.ObjectId;
};

type ClientLite = EntityWithId & {
	buyer?: string;
};

type ContactLite = EntityWithId;

type AuctionLite = EntityWithId & {
	region_id?: Types.ObjectId | null;
};

type VehicleModelLite = EntityWithId & {
	brand_id: Types.ObjectId;
};

type ServiceLite = EntityWithId & {
	name: string;
	price: number;
};

function pad6(n: number): string {
	return String(n).padStart(6, "0");
}

function parseTrailingNumber(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const match = value.match(/(\d+)$/);
	if (!match) return fallback;
	const parsed = Number.parseInt(match[1], 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function pick<T>(arr: T[], idx: number): T {
	return arr[idx % arr.length];
}

function randomDateBack(daysBack: number): Date {
	const now = Date.now();
	const min = now - daysBack * 24 * 60 * 60 * 1000;
	return new Date(min + Math.random() * (now - min));
}

export const seeder = async (): Promise<void> => {
	const COUNT = 500;

	const [clients, contacts, auctions, vehicleModels, services] = await Promise.all([
		Client.find({}, { _id: 1, buyer: 1 }).lean<ClientLite[]>(),
		Contact.find({}, { _id: 1 }).lean<ContactLite[]>(),
		Auction.find({}, { _id: 1, region_id: 1 }).lean<AuctionLite[]>(),
		VehicleModel.find({}, { _id: 1, brand_id: 1 }).lean<VehicleModelLite[]>(),
		Service.find({}, { _id: 1, name: 1, price: 1 }).lean<ServiceLite[]>(),
	]);

	if (clients.length === 0) {
		throw new Error("No hay clientes para crear operaciones. Ejecuta seedDemoData primero.");
	}
	if (contacts.length === 0) {
		throw new Error("No hay contactos para crear operaciones. Ejecuta seedDemoData primero.");
	}
	if (auctions.length === 0) {
		throw new Error("No hay subastas para crear operaciones. Ejecuta seedDemoData primero.");
	}
	if (vehicleModels.length === 0) {
		throw new Error("No hay modelos para crear operaciones. Ejecuta seedDemoData primero.");
	}
	if (services.length === 0) {
		throw new Error("No hay servicios para crear operation services. Ejecuta seedDemoData primero.");
	}

	const lastOperation = await Operation.findOne({}, { key: 1, batch: 1 }).sort({ key: -1 }).lean<{
		key?: string;
		batch?: string;
	}>();

	const operationStart = parseTrailingNumber(lastOperation?.key, 0) + 1;
	const batchStart = parseTrailingNumber(lastOperation?.batch, operationStart - 1) + 1;

	const operationDocs = Array.from({ length: COUNT }, (_, i) => {
		const folio = batchStart + i;
		const year = 2000 + ((operationStart + i) % 26);
		const client = pick(clients, i);
		const contact = pick(contacts, i * 5 + 3);
		const auction = pick(auctions, i * 7 + 2);
		const model = pick(vehicleModels, i * 11 + 1);
		const capturedAt = randomDateBack(540);
		const hasTitleDate = i % 3 !== 0;

		return {
			key: `O-${pad6(operationStart + i)}`,
			batch: pad6(folio), // folio de 6 digitos
			buyer: client.buyer ?? undefined, // buyer de operacion igual al buyer del cliente
			client_id: client._id,
			contact_id: contact._id,
			title_type: i % 2 === 0 ? "mail" : "driver",
			title_date: hasTitleDate ? randomDateBack(500) : undefined,
			year,
			model_id: model._id,
			brand_id: model.brand_id,
			pin: `PIN${pad6((operationStart + i) % 1000000)}`,
			vin: `VIN${pad6((operationStart * 3 + i * 17) % 1000000)}`,
			color: pick(["White", "Black", "Gray", "Silver", "Blue", "Red"], i),
			auction_id: auction._id,
			region_id: auction.region_id ?? undefined,
			expiration_date: randomDateBack(365),
			captured_at: capturedAt,
			has_key: i % 4 !== 0,
			cost: 1200 + ((i * 137) % 18000),
			notes: i % 5 === 0 ? "Operacion demo generada por seeder" : undefined,
		};
	});

	const insertedOperations = await Operation.insertMany(operationDocs);
	console.log(`  ✓ ${insertedOperations.length} operaciones creadas`);

	const operationServiceDocs: Array<{
		operation_id: Types.ObjectId;
		concept: string;
		date: Date;
		type: "D" | "P";
		charge?: number;
		payment?: number;
	}> = [];

	insertedOperations.forEach((operation, i) => {
		const svcA = pick(services, i);
		const svcB = pick(services, i * 3 + 1);

		const chargeDate = randomDateBack(420);
		const chargeAmount = Math.max(50, Math.round(svcA.price * (0.7 + (i % 6) * 0.08)));

		operationServiceDocs.push({
			operation_id: operation._id,
			concept: svcA.name,
			date: chargeDate,
			type: "D",
			charge: chargeAmount,
		});

		if (i % 2 === 0) {
			const paymentAmount = Math.max(25, Math.round(chargeAmount * (0.6 + (i % 3) * 0.15)));
			operationServiceDocs.push({
				operation_id: operation._id,
				concept: `${svcB.name} PAYMENT`,
				date: randomDateBack(300),
				type: "P",
				payment: paymentAmount,
			});
		}
	});

	const insertedOperationServices = await OperationService.insertMany(operationServiceDocs);
	console.log(`  ✓ ${insertedOperationServices.length} operation services creados`);

	console.log("\n  Seeder de operaciones completado.");
	console.log(
		`  Total: ${insertedOperations.length} operaciones y ${insertedOperationServices.length} operation services.`,
	);
};

export default { title, description, seeder };
