import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
//@ts-expect-error no types there
import { handler as lambdaAiHandler } from "../chss-lambda-ai/dist/index.js";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use(express.static("./chss-frontend/dist"));

app.post("/lambda-ai", async (req, res) => {
  const result: { body: string } = await lambdaAiHandler(
    {
      queryStringParameters: req.query,
      body: JSON.stringify(req.body),
    } as APIGatewayProxyEvent,
    {} as Context,
    () => {}
  );

  return res.json(JSON.parse(result.body));
});

app.listen(3000, () => {
  console.log("dev server is running on port 3000");
});
