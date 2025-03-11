/**
 * @jest-environment node
 */

import { handler } from "../netlify/functions/api.js";

describe("Recipe API", () => {
  it("should return error for missing ingredients", async () => {
    const event = {
      path: "/api/search",
      httpMethod: "GET",
      queryStringParameters: {}
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Ingredients are required");
  });

  it("should return error for missing recipe ID", async () => {
    const event = {
      path: "/api/recipe",
      httpMethod: "GET",
      queryStringParameters: {}
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Recipe ID is required");
  });

  it("should return ok for health check", async () => {
    const event = {
      path: "/health",
      httpMethod: "GET",
      queryStringParameters: {}
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe("ok");
  });
}); 