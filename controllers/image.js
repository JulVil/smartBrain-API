const {ClarifaiStub, grpc} = require("clarifai-nodejs-grpc");

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key ---");

//gRPC client for using Clarifai -> https://github.com/Clarifai/clarifai-nodejs-grpc
const handleApiCall = (req, res) => {
    const { input } = req.body;

    stub.PostModelOutputs(
        {
            model_id: "face-detection",
            inputs: [{data: {image: {url: input}}}]
        },
        metadata,
        (err, response) => {
            if (err) {
                res.status(400).json('error')
                console.log("Error: " + err);
                return;
            }

            if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
                res.status(400).json('error')
                return;
            }
            //added the .outputs to the response data for it to be usable in the front-end
            res.json(response.outputs);
        }
    );
}

const handleImage = (req, res, postgresDB) => {
    const { id } = req.body;

    postgresDB('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0].entries);
        })
        .catch(err => res.status(400).json('Unable to get entries'))
}

module.exports = {
    handleImage,
    handleApiCall
}