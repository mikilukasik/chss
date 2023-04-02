import express from "express";
//@ts-expect-error no types there
import { handler as lambdaAiHandler } from "../chss-lambda-ai/dist/index.js";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

const app = express();

app.use(express.static("./chss-frontend/dist"));

app.get("/lambda-ai", async (req, res) => {
  const result: { body: string } = await lambdaAiHandler(
    {
      queryStringParameters: req.query,
    } as APIGatewayProxyEvent,
    {} as Context,
    () => {}
  );

  console.log({ result });

  return res.json(JSON.parse(result.body));
});

app.listen(3000, () => {
  console.log("dev server is running on port 3000");
});
