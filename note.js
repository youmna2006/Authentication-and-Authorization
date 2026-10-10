const { EntitySchema } = require('typeorm');

const NoteSchema = new EntitySchema({
    name: "Note",
    tableName: "notes",

    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        title: {
            type: "varchar",
            length: 255
        },
        content: {
            type: "text"
        }
    },
    relations: {
        user: {
            target: "User",
            type: "many-to-one",
            joinColumn: true,
            nullable: false,
            inverseSide: "notes"
        }
    }
});

module.exports = NoteSchema;