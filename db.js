const {DataSource} = require("typeorm");

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ,
    port: process.env.DB_PORT ,
    username: process.env.DB_USERNAME ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
   entities: [
    require("./entities/user"),
    require("./entities/note")
],
migrations: ["migrations/*.js"],
subscribers: ["subscribers/*.js"],
});
module.exports = AppDataSource;