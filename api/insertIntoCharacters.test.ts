import { rest } from "msw";
import { server } from "../mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("Test", () => {
  rest.get(
    `https://sotdl-api-fetch.vercel.app/api/ancestries?name=Dwarf`,
    (req, res, ctx) => {
      return res(ctx.json({ firstName: "John" }));
    }
  ),
    expect("Test").toBe("Test");
});
