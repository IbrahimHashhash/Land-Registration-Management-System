# Sample Data

## `mongodb/`

One JSON file per collection, ready to import with `mongoimport`:

```
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection applicants            --file mongodb/applicants.json            --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection parcels               --file mongodb/parcels.json               --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection staff_members         --file mongodb/staff_members.json         --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection land_applications     --file mongodb/land_applications.json     --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection survey_tasks          --file mongodb/survey_tasks.json          --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection survey_reports        --file mongodb/survey_reports.json        --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection performance_logs      --file mongodb/performance_logs.json      --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection certificates          --file mongodb/certificates.json          --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection application_documents --file mongodb/application_documents.json --jsonArray
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection objections            --file mongodb/objections.json            --jsonArray
```

For a richer dataset (12 applications across every status, including
certificates and audit logs) run the seed script instead:

```
cd backend
python seed_demo_data.py
```

## `postman/`

`LRMIS.postman_collection.json` contains a request for every endpoint, grouped
by module. Import it into Postman, set the `baseUrl` collection variable to
your API URL (default `http://localhost:8000`), and run the requests in order.
