import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: false });

export default sql;
