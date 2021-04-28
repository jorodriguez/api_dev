
/*const request = require('request');
var FormData = require('form-data');
*/

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

//var https = require('https');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || 'hjxjcdupm',
    api_key: process.env.CLOUD_API_KEY || '126569266916488',
    api_secret: process.env.CLOUD_SECRET || 'Pka9QCcnwfl-gggM0wKJrOs8KcQ'
});


const uploadCloud = (buffer,folder) => {
    console.log("@uploadCloudDao bufer "+(buffer != null)+" folder "+folder);
    return new Promise((resolve, reject) => {
        console.log("@promise");
        try {

            if (!buffer || buffer == null || !folder || folder == null) {
                reject({upload:false, error: "Valores requeridos para subir (imagen o folder )." });
                return;
            }

            let stream = cloudinary.uploader.upload_stream(
                { folder: folder },
                (error, result) => {
                    if (result) {
                        console.log("Upload OK Cloudinary " + result);
                        resolve({ upload: true, ...result } );
                    } else {
                        console.log("Error " + result);
                        reject({upload:false,...error});
                    }
                }
            );
            streamifier.createReadStream(buffer).pipe(stream);

        } catch (e) {
            console.log("ERROR " + e);
            reject({ upload: false, ...e });
        }

    });

};
/*
const uploadCloud = (imagen) => {
    console.log("@uploadCloudDao");
    return new Promise((resolve, reject) => {
        console.log("@promise");
        try {

            var form = new FormData();
            //form.append('file', fs.createReadStream(__dirname + '/image.jpg'));
            //form.append('file', imagen);

            var options = {
                url: URL_CLOUD,
                method: 'POST',
                formData: {
                    file:imagen
                },
                headers: form.getHeaders()
            };
            
            console.log("@creado http");

            var request = https.request(options, function (res) {
                console.log(res);
                reject({ upload: true, ...res });
            });
            
            console.log("@agreando pipe");
            form.pipe(request);

            request.on('error', function (error) {
                console.log("ERRRRRRRRRROR"+error);
                reject({ upload: false, ...error });
            });


           
        } catch (e) {
            console.log("ERROR " + e);
            reject({ upload: false, ...e });
        }

    });

};
*/

module.exports = { uploadCloud };