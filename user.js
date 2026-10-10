const {EntitySchema} = require('typeorm');

const userSchema = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        username: {
            type: "varchar",
            unique: true
        },
        email: {
            type: "varchar",
            length: 255,
            unique: true
        },
        password: {
            type: "varchar",
            unique: true
        }
        
    },
    relations: {
        notes: {
            target: "Note",
            type: "one-to-many",
            inverseSide: "user"
        }
    }
});
module.exports = userSchema;
