import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Assignment API",
    version: "1.0.0",
    description: "REST API for auth, users, and tasks",
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./Router/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
