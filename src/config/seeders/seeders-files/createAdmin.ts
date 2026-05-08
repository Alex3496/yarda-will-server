import User from "../../../models/user.model";

export const title = "Crear usuario administrador";
export const description =
	"Crea o actualiza un usuario administrador por defecto para acceso inicial";

const adminData = {
	username: "admin",
	email: "admin@yarda-will.com",
	password: "Admin123456",
	firstName: "System",
	lastName: "Admin",
	role: "admin" as const,
	isActive: true,
};

export const seeder = async (): Promise<void> => {
	const existingAdmin = await User.findOne({ email: adminData.email }).select(
		"+password",
	);

	if (existingAdmin) {
		existingAdmin.username = adminData.username;
		existingAdmin.password = adminData.password;
		existingAdmin.firstName = adminData.firstName;
		existingAdmin.lastName = adminData.lastName;
		existingAdmin.role = adminData.role;
		existingAdmin.isActive = adminData.isActive;

		await existingAdmin.save();

		console.log("Administrador actualizado:", adminData.email);
		console.log("Password temporal:", adminData.password);
		return;
	}

	await User.create(adminData);

	console.log("Administrador creado:", adminData.email);
	console.log("Password temporal:", adminData.password);
};

export default {
	title,
	description,
	seeder,
};
