import Service from "../../../models/service.model";

export const title = "Migrar región de servicios (region_ids → region_id)";
export const description =
    "Convierte el campo region_ids (lista) de los servicios al campo region_id (una sola región) y elimina los índices anteriores. Se puede ejecutar más de una vez.";

// Indexes created by the previous array-based schema
const OLD_INDEXES = ["region_ids_1", "unique_default_service_per_region"];

export const seeder = async (): Promise<void> => {
    const collection = Service.collection;

    // 1. Drop the old indexes first: the old unique index would treat every default
    //    service without region_ids as a duplicate once the field is removed.
    const existingIndexes = (await collection.indexes()).map((i) => i.name);
    for (const name of OLD_INDEXES) {
        if (name && existingIndexes.includes(name)) {
            await collection.dropIndex(name);
            console.log(`Índice eliminado: ${name}`);
        }
    }

    // 2. Move the first region of the array into region_id
    const docs = await collection
        .find({ region_ids: { $exists: true } }, { projection: { key: 1, region_ids: 1, region_id: 1, is_default: 1 } })
        .toArray();

    let migrated = 0;
    for (const doc of docs) {
        const regions = Array.isArray(doc.region_ids) ? doc.region_ids : [];
        if (regions.length > 1) {
            console.warn(`  ${doc.key}: tenía ${regions.length} regiones, se conserva solo la primera.`);
        }

        // Keep an already migrated region_id if present
        const regionId = doc.region_id ?? regions[0] ?? null;

        await collection.updateOne(
            { _id: doc._id },
            {
                $set: { region_id: regionId, is_default: !!doc.is_default && !!regionId },
                $unset: { region_ids: "" },
            },
        );
        migrated++;
    }

    // 3. Make sure the new indexes exist (they may have failed on startup before the data was migrated)
    await Service.createIndexes();

    console.log(`Servicios migrados: ${migrated}.`);
};

export default { title, description, seeder };
