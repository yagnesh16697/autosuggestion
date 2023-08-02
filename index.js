const express = require("express");
const { Client } = require("@elastic/elasticsearch");
const { MongoClient } = require("mongodb");

// Create an Express app
const app = express();
const port = 3000;

// Connect to MongoDB
const mongoClient = new MongoClient("mongodb://localhost:27028");
const dbName = "autosuggestion";
const collectionName = "product_master";

// Connect to Elasticsearch
const esClient = new Client({
  node: "http://localhost:9200",
});
const indexName = "product_index";

// Fetch data from MongoDB and index in Elasticsearch
app.get("/index", async (req, res) => {
  try {
    // Connect to MongoDB
    await mongoClient.connect();

    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);
    console.log("collection: ", collection);

    // Get the total count of documents in the collection
    const totalCount = await collection.countDocuments();
    console.log("totalCount: ", totalCount);

    // Create an Elasticsearch index if it doesn't exist
    await esClient.indices.create({ index: indexName });

    // Set the batch size (e.g., 20,000 records per batch)
    const batchSize = 20000;
    let skip = 0;
    let indexedCount = 0;

    console.log(`Starting the indexing process for ${totalCount} documents.`);

    while (skip < totalCount) {
      // Fetch data from MongoDB in batches
      const data = await collection
        .find()
        .skip(skip)
        .limit(batchSize)
        .toArray();

      // Index data in Elasticsearch for this batch
      for (const document of data) {
        const tDoc = document;
        delete tDoc._id;
        await esClient.index({
          index: indexName,
          body: tDoc,
        });
        indexedCount++;
      }

      console.log(`Indexed ${indexedCount} documents out of ${totalCount}.`);

      // Move to the next batch
      skip += batchSize;
    }

    console.log("Indexing complete.");
    res.send("Indexing complete.");
  } catch (error) {
    console.error("Error while indexing:", error);
    res.status(500).send("An error occurred.");
  }
});

// Get suggestions from Elasticsearch
app.get("/suggestions", async (req, res) => {
  try {
    const userQuery = req.query.query; // Assuming the user query is provided as 'query' parameter
    const suggestionFields = ["Product Name", "Category"];
    const response = await esClient.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: userQuery,
            fields: suggestionFields,
          },
        },
      },
    });
    const suggestions = response.hits.hits.map((hit) => hit._source);
    res.json(suggestions);
  } catch (error) {
    console.error("Error while fetching suggestions:", error);
    res.status(500).send("An error occurred.");
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
