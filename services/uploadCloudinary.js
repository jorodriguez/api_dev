const uploadService = require('../domain/uploadService');
const handle = require('../helpers/handlersErrors');
const CONSTANTES = require('../utils/Constantes');
/*
const req = require("request");
const fs = require("fs");
const path = require('path');
var http = require('http');

//const multiparty = require("multiparty");
var FormData = require('form-data');

const uploadImagenPerfil = async (request, response) => {
    try {
        const data = { id_alumno, genero } = request.body;
        const image = request.file;
        //let re = await uploadService.upload(id_alumno, genero, image);
        const fileToUpload = request.file;
        console.log("Type " + (typeof fileToUpload));
        console.log("originalFilename " + fileToUpload.originalname);
        console.log("mimeType " + fileToUpload.mimetype);
        console.log("encoding " + fileToUpload.encoding);
        console.log("fieldname " + fileToUpload.fieldname);
        console.log("size " + fileToUpload.size);        
        console.log("buffer {type:buffer,data:[]}");

        // var fileOfBlob = new File([request.file],"file.jpeg");
        //form.append("file", fileOfBlob);

        console.log("xx");

        //value: fs.createReadStream(path.join(__dirname, '..', '..', 'upload', fileToUpload.filename)),

        let formData = {
            imagen: {
                name:'imagen',
                //value: fs.createReadStream(path.join(__dirname, '..', '..','upload', fileToUpload.filename)),
                value: Buffer.from(fileToUpload.buffer),
                options: {
                    filename: fileToUpload.originalname,
                    contentType: fileToUpload.mimetype
                }
            }
                      

        };

        console.log("aaa");
        let options = {
            url: 'http://localhost:5100/imagen',
            method: 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            formData: formData
        }
        console.log("bb");
        req(options, function (err, resp, body) {
            if (err)
                //cb(err);
                console.log("ERORR " + JSON.stringify(err));
            if (!err && resp.statusCode == 200) {
                //cb(null, body);
                console.log("OOOOKKK " + JSON.stringify(resp));
            }
        });

        response.status(200).json({ ok: "ok" });
    } catch (e) {
        console.log("ERROR " + JSON.stringify(e));
        handle.callbackErrorNoControlado(e, response);
    }
}
*/


/*
app.post('/imagen', fileUpload.single('image'), function (req, res, next) {
    async function upload() {
        try {
            let result = await uploadCloudinary
                .streamUpload(
                    req.file.buffer,
                    constantes.FOLDER_PERFILES_CLOUDNARY
                );
            res.status(200).json({ upload: true, ...result });
            console.log(result);
        } catch (error) {
            console.log("Error al cargar la imagen " + error);
            res.status(400).json({ upload: false, error: error });
        }
    }
    upload();
});*/


const uploadImagenPerfil = async (request, response) => {
    console.log("@uploadImagenPerfil");
    try {

        const data = { id_alumno, genero } = request.body;
        const image = request.file.buffer;
        let re = await uploadService.upload(id_alumno, genero, image);

        response.status(200).json(re);
    } catch (error) {
        console.log("Error al cargar la imagen " + JSON.stringify(error));
        response.status(400).json({ upload: false, error: error });
    }
};


module.exports = { uploadImagenPerfil };