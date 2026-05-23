import Auction from "../../../models/auction.model";
import Brand from "../../../models/brand.model";
import Client from "../../../models/clients.model";
import Contact from "../../../models/contact.model";
import Driver from "../../../models/driver.model";
import Region from "../../../models/region.model";
import Service from "../../../models/service.model";
import VehicleModel from "../../../models/vehicleModel.model";

export const title = "Datos de demostración";
export const description =
	"Crea ~500 registros de prueba para clientes, regiones, subastas, contactos, choferes y servicios, además de marcas y modelos de vehículos";

// ── Data pools ────────────────────────────────────────────────────────────────

const firstNames = [
	"Carlos", "María", "José", "Ana", "Luis", "Laura", "Miguel", "Patricia",
	"Jorge", "Sandra", "Roberto", "Claudia", "Fernando", "Gabriela", "Alejandro",
	"Mónica", "Ricardo", "Beatriz", "Eduardo", "Carmen", "Francisco", "Verónica",
	"Antonio", "Cristina", "Manuel", "Isabel", "Sergio", "Diana", "Javier", "Elena",
	"David", "Rosa", "Pablo", "Natalia", "Adrián", "Alicia", "Óscar", "Silvia",
	"Raúl", "Lorena", "Gustavo", "Irene", "Alberto", "Marta", "Víctor", "Nuria",
	"Héctor", "Pilar", "Rubén", "Esther",
];

const lastNames = [
	"García", "Martínez", "López", "González", "Rodríguez", "Hernández", "Pérez",
	"Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz",
	"Morales", "Reyes", "Jiménez", "Vargas", "Gutiérrez", "Medina", "Ruiz", "Ortiz",
	"Méndez", "Castillo", "Guerrero", "Moreno", "Delgado", "Herrera", "Aguilar",
	"Vega", "Contreras", "Ramos", "Romero", "Núñez", "Fuentes", "Miranda", "Rojas",
	"Navarro", "Domínguez", "Estrada", "Campos", "Parra", "Ríos", "Pacheco",
	"Sandoval", "Ibarra", "Carrillo", "Espinoza", "Bravo",
];

const usStates = [
	"Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
	"Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
	"Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
	"Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
	"Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
	"New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
	"Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
	"Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
	"West Virginia", "Wisconsin", "Wyoming",
];

const usCities = [
	"Atlanta", "Austin", "Baltimore", "Boston", "Charlotte", "Chicago",
	"Cleveland", "Columbus", "Dallas", "Denver", "Detroit", "El Paso",
	"Fort Worth", "Fresno", "Houston", "Indianapolis", "Jacksonville", "Kansas City",
	"Las Vegas", "Long Beach", "Los Angeles", "Louisville", "Memphis", "Mesa",
	"Miami", "Milwaukee", "Minneapolis", "Nashville", "New Orleans", "New York",
	"Oakland", "Oklahoma City", "Omaha", "Philadelphia", "Phoenix", "Pittsburgh",
	"Portland", "Raleigh", "Sacramento", "San Antonio", "San Diego", "San Francisco",
	"San Jose", "Seattle", "Tucson", "Tulsa", "Virginia Beach", "Washington",
	"Wichita", "Arlington",
];

const mexicanStates = [
	"Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
	"Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
	"Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Estado de México",
	"Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
	"Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
	"Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const mexicanCities = [
	"Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez",
	"Zapopan", "Mérida", "San Luis Potosí", "Aguascalientes", "Hermosillo",
	"Mexicali", "Culiacán", "Acapulco", "Tlalnepantla", "Cancún", "Querétaro",
	"Morelia", "Ecatepec", "Chihuahua", "Saltillo", "Naucalpan", "Durango",
	"Toluca", "Tuxtla Gutiérrez", "Veracruz",
];

const auctionCompanies = [
	"Copart", "IAAI", "Manheim", "ADESA", "AutoNation Auction",
	"DAA Pacific", "OVE Services", "SmartAuction", "ServNet", "TradeRev",
];

const serviceTypes = [
	"Transporte terrestre", "Transporte marítimo", "Inspección vehicular",
	"Trámite de título", "Despacho aduanal", "Limpieza y detallado",
	"Almacenaje", "Seguro de transporte", "Gestión de subasta",
	"Trámite de placas", "Verificación mecánica", "Liberación de embargo",
	"Transferencia de título", "Servicio de grúa", "Fotografía vehicular",
];

const serviceLevels = [
	"básico", "estándar", "premium", "express", "internacional",
	"local", "nacional", "especial", "urgente", "regular",
	"económico", "plus", "profesional", "ejecutivo", "corporativo",
	"residencial", "comercial", "industrial", "prioritario", "bajo demanda",
	"programado", "sin cita", "24h", "72h", "semanal",
	"quincenal", "mensual", "anual", "por lote", "por unidad",
	"documentado", "express plus", "VIP", "asegurado", "garantizado",
];

const brandModels: Record<string, string[]> = {
	Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "Prius"],
	Ford: ["F-150", "Mustang", "Explorer", "Escape", "Edge", "Bronco", "Ranger"],
	Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Colorado", "Camaro", "Blazer"],
	Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Passport"],
	Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Titan", "Kicks"],
	BMW: ["3 Series", "5 Series", "X3", "X5", "7 Series", "X1"],
	"Mercedes-Benz": ["C-Class", "E-Class", "GLE", "GLC", "S-Class", "A-Class"],
	Audi: ["A4", "A6", "Q5", "Q7", "A3", "Q3"],
	Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona"],
	Kia: ["Forte", "Optima", "Sportage", "Telluride", "Sorento", "Soul"],
	Dodge: ["Charger", "Challenger", "Durango", "Journey"],
	Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator"],
	Ram: ["1500", "2500", "3500", "ProMaster"],
	GMC: ["Sierra", "Terrain", "Acadia", "Canyon", "Yukon"],
	Volkswagen: ["Jetta", "Passat", "Tiguan", "Atlas", "Golf"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], i: number): T {
	return arr[i % arr.length];
}

function padKey(prefix: string, n: number): string {
	return `${prefix}${String(n).padStart(6, "0")}`;
}

function lastKeyToStart(key: string | undefined, prefix: string): number {
	if (!key) return 1;
	return Number.parseInt(key.replace(prefix, ""), 10) + 1;
}

function fakePhone(): string {
	const a = 200 + Math.floor(Math.random() * 800);
	const b = 100 + Math.floor(Math.random() * 900);
	const c = 1000 + Math.floor(Math.random() * 9000);
	return `(${a}) ${b}-${c}`;
}

function normalizeForEmail(str: string): string {
	return str
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

// ── Seeder ────────────────────────────────────────────────────────────────────

export const seeder = async (): Promise<void> => {
	const COUNT = 500;

	// ── Brands ─────────────────────────────────────────────────────────────────
	const lastBrand = await Brand.findOne({}, { key: 1 }).sort({ key: -1 });
	const brandStart = lastKeyToStart(lastBrand?.key, "M-");

	const brandEntries = Object.keys(brandModels);
	const brandDocs = brandEntries.map((name, i) => ({
		key: padKey("M-", brandStart + i),
		name,
	}));

	const insertedBrands = await Brand.insertMany(brandDocs);
	console.log(`  ✓ ${insertedBrands.length} marcas creadas`);

	// ── Vehicle models ─────────────────────────────────────────────────────────
	const lastVehicleModel = await VehicleModel.findOne({}, { key: 1 }).sort({ key: -1 });
	const vmStart = lastKeyToStart(lastVehicleModel?.key, "MD-");

	let vmIdx = 0;
	const vehicleModelDocs = insertedBrands.flatMap((brand) => {
		const models = brandModels[brand.name] ?? [];
		return models.map((modelName) => ({
			key: padKey("MD-", vmStart + vmIdx++),
			name: modelName,
			brand_id: brand._id,
		}));
	});

	const insertedVehicleModels = await VehicleModel.insertMany(vehicleModelDocs);
	console.log(`  ✓ ${insertedVehicleModels.length} modelos de vehículos creados`);

	// ── Regions ─────────────────────────────────────────────────────────────────
	const lastRegion = await Region.findOne({}, { key: 1 }).sort({ key: -1 });
	const regionStart = lastKeyToStart(lastRegion?.key, "R-");

	const regionNames: string[] = [];

	// ~300 US combos
	outer_us: for (const city of usCities) {
		for (const state of usStates) {
			regionNames.push(`${city}, ${state}`);
			if (regionNames.length === 300) break outer_us;
		}
	}

	// ~200 MX combos
	outer_mx: for (const city of mexicanCities) {
		for (const state of mexicanStates) {
			regionNames.push(`${city}, ${state}`);
			if (regionNames.length === COUNT) break outer_mx;
		}
	}

	const regionDocs = regionNames.map((name, i) => ({
		key: padKey("R-", regionStart + i),
		name,
	}));

	const insertedRegions = await Region.insertMany(regionDocs);
	console.log(`  ✓ ${insertedRegions.length} regiones creadas`);

	// ── Auctions ────────────────────────────────────────────────────────────────
	const lastAuction = await Auction.findOne({}, { key: 1 }).sort({ key: -1 });
	const auctionStart = lastKeyToStart(lastAuction?.key, "S-");

	// 10 companies × 50 cities = 500 unique combinations
	const auctionDocs = Array.from({ length: COUNT }, (_, i) => {
		const company = pick(auctionCompanies, i % auctionCompanies.length);
		const city = usCities[Math.floor(i / auctionCompanies.length) % usCities.length];
		const region = insertedRegions[i % insertedRegions.length];
		return {
			key: padKey("S-", auctionStart + i),
			name: `${company} - ${city}`,
			region_id: region._id,
		};
	});

	const insertedAuctions = await Auction.insertMany(auctionDocs);
	console.log(`  ✓ ${insertedAuctions.length} subastas creadas`);

	// ── Clients ─────────────────────────────────────────────────────────────────
	const lastClient = await Client.findOne({}, { key: 1 }).sort({ key: -1 });
	const clientStart = lastKeyToStart(lastClient?.key, "C-");

	const clientDocs = Array.from({ length: COUNT }, (_, i) => {
		const first = pick(firstNames, i * 3 + 1);
		const last1 = pick(lastNames, i * 2);
		const last2 = pick(lastNames, i * 2 + 7);
		const fullname = `${first} ${last1} ${last2}`;
		const buyerNum = String(clientStart + i).padStart(6, "0");
		const emailLocal = `${normalizeForEmail(first)}.${normalizeForEmail(last1)}${clientStart + i}`;
		return {
			key: padKey("C-", clientStart + i),
			fullname,
			buyer: `B-${buyerNum}`,
			email: `${emailLocal}@demo.com`,
			phone: fakePhone(),
		};
	});

	const insertedClients = await Client.insertMany(clientDocs);
	console.log(`  ✓ ${insertedClients.length} clientes creados`);

	// ── Contacts ────────────────────────────────────────────────────────────────
	const lastContact = await Contact.findOne({}, { key: 1 }).sort({ key: -1 });
	const contactStart = lastKeyToStart(lastContact?.key, "CT-");

	const contactDocs = Array.from({ length: COUNT }, (_, i) => {
		const first = pick(firstNames, i * 5 + 3);
		const last1 = pick(lastNames, i * 3 + 11);
		return {
			key: padKey("CT-", contactStart + i),
			name: `${first} ${last1}`,
			phone: fakePhone(),
		};
	});

	const insertedContacts = await Contact.insertMany(contactDocs);
	console.log(`  ✓ ${insertedContacts.length} contactos creados`);

	// ── Drivers ─────────────────────────────────────────────────────────────────
	const lastDriver = await Driver.findOne({}, { key: 1 }).sort({ key: -1 });
	const driverStart = lastKeyToStart(lastDriver?.key, "CF-");

	const driverDocs = Array.from({ length: COUNT }, (_, i) => {
		const first = pick(firstNames, i * 7 + 5);
		const last1 = pick(lastNames, i * 4 + 3);
		const last2 = pick(lastNames, i * 4 + 17);
		return {
			key: padKey("CF-", driverStart + i),
			name: `${first} ${last1} ${last2}`,
		};
	});

	const insertedDrivers = await Driver.insertMany(driverDocs);
	console.log(`  ✓ ${insertedDrivers.length} choferes creados`);

	// ── Services ────────────────────────────────────────────────────────────────
	const lastService = await Service.findOne({}, { key: 1 }).sort({ key: -1 });
	const serviceStart = lastKeyToStart(lastService?.key, "SR-");

	// 15 types × 35 levels = 525 combinations, take first 500
	const serviceDocs = Array.from({ length: COUNT }, (_, i) => {
		const type = pick(serviceTypes, i % serviceTypes.length);
		const level = pick(serviceLevels, Math.floor(i / serviceTypes.length));
		const price = (50 + ((i * 37 + 13) % 200)) * 10;
		return {
			key: padKey("SR-", serviceStart + i),
			name: `${type} ${level}`,
			price,
		};
	});

	const insertedServices = await Service.insertMany(serviceDocs);
	console.log(`  ✓ ${insertedServices.length} servicios creados`);

	console.log("\n  Seeder de demostración completado.");
	console.log(`  Total: ${insertedBrands.length} marcas, ${insertedVehicleModels.length} modelos, ` +
		`${insertedRegions.length} regiones, ${insertedAuctions.length} subastas, ` +
		`${insertedClients.length} clientes, ${insertedContacts.length} contactos, ` +
		`${insertedDrivers.length} choferes, ${insertedServices.length} servicios.`);
};

export default { title, description, seeder };
