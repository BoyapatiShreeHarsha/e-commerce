import { GraphQLScalarType, Kind } from "graphql";

// Define a custom "any"-like scalar
const AnyScalar = new GraphQLScalarType({
  name: "Any",
  description: "Custom scalar type for any value",
  serialize(value) {
    return value; // Value sent to the client
  },
  parseValue(value) {
    return value; // Value received from the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.OBJECT) {
      if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
        return ast.value;
      } else if (ast.kind === Kind.OBJECT) {
        return ast.fields.reduce((value: { [key: string]: any }, field) => {
          value[field.name.value] = field.value;
          return value;
        }, {});
      }
    }
    return null;
  }
});

export default AnyScalar;
