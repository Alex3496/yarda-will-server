import Client, { normalizeBuyer } from "../../../models/clients.model";

export const title = "Migrar Buyer Id de clientes (opcional y único)";
export const description =
    "Normaliza el Buyer Id de los clientes (mayúsculas, vacío → null) y cambia el índice único para permitir varios clientes sin Buyer Id. Si encuentra duplicados se detiene sin cambiar nada. Se puede ejecutar más de una vez.";

// Plain unique index from the old schema: treats every missing buyer as a duplicate null
const OLD_INDEX = "buyer_1";

export const seeder = async (): Promise<void> => {
    const collection = Client.collection;

    const docs = await collection
        .find({ buyer: { $exists: true } }, { projection: { key: 1, fullname: 1, buyer: 1 } })
        .toArray();

    // 1. Detect ids that would collide once normalized (e.g. "abc123" and "ABC123")
    const groups = new Map<string, typeof docs>();
    for (const doc of docs) {
        const normalized = normalizeBuyer(doc.buyer);
        if (!normalized) continue;
        groups.set(normalized, [...(groups.get(normalized) ?? []), doc]);
    }

    const duplicates = [...groups.entries()].filter(([, list]) => list.length > 1);
    if (duplicates.length) {
        console.error("Se encontraron Buyer Id repetidos. Corrígelos y vuelve a ejecutar este seeder:");
        for (const [buyer, list] of duplicates) {
            console.error(`  ${buyer}: ${list.map((d) => `${d.key} ${d.fullname} ("${d.buyer}")`).join(", ")}`);
        }
        console.error("No se hizo ningún cambio.");
        return;
    }

    // 2. Drop the old index so several clients can have no buyer id
    const existingIndexes = (await collection.indexes()).map((i) => i.name);
    if (existingIndexes.includes(OLD_INDEX)) {
        await collection.dropIndex(OLD_INDEX);
        console.log(`Índice eliminado: ${OLD_INDEX}`);
    }

    // 3. Normalize stored values
    let updated = 0;
    for (const doc of docs) {
        const normalized = normalizeBuyer(doc.buyer);
        if (normalized !== doc.buyer) {
            await collection.updateOne({ _id: doc._id }, { $set: { buyer: normalized } });
            updated++;
        }
    }

    // 4. Create the new partial unique index
    await Client.createIndexes();

    console.log(`Clientes revisados: ${docs.length}. Buyer Id normalizados: ${updated}.`);
};

export default { title, description, seeder };
