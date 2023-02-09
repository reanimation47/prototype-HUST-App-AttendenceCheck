const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const {GoogleSheetsAPI} = require(__dirname + "/assets/js/googlesheetClass.js")

//Sheets API class available:
// updateSingleRow(target, newValue)
//getSpreadsheet

// const {
//     google
// } = require("googleapis");

// const auth = new google.auth.GoogleAuth({
//     keyFile: "credentials.json",
//     scopes: "https://www.googleapis.com/auth/spreadsheets",
// });

//sheetsapi.updateSingleRow("A1", "20198323")

app.use(express.static(__dirname));
app.use(bodyParser.json());

// let student_ids = ['12345678', '1111', '20198323']
let student_ids = []
let studentId_to_studentName = {
    20198323 : "Le Doan Anh Quan",
    12345678 : "Captain America",
    20207666: "Nguyễn Văn Duy",
    20198255: "Vũ Ngọc Quang"
}
let attendance_sheet

//studentId_to_studentName[20198323] = "Anh Quan"

let sheetsapi = new GoogleSheetsAPI("AI-Database")
const get_attendance_sheet = async () =>{
    let _data = await sheetsapi.getSpreadsheet()
    console.log(_data.data.values)
    console.log(_data.data.values.length)
    
    return _data.data.values
}

const get_student_ids_from_sheet = async (sheet) =>{
    const _l = sheet.length
    let _student_ids = []
    for (i = 0; i < _l; i ++)
    {
        _student_ids[i] = sheet[i][0]
    }
    console.log(_student_ids)
    return _student_ids;
}

const update_student_names_to_sheet = async (_student_ids) =>{
    const _l = _student_ids.length
    for (i = 0; i < _l; i++)
    {
        sheetsapi.updateSingleRow(`B${i+1}`, studentId_to_studentName[_student_ids[i]])
    }
    return 1;
}

const update_new_attendee = (new_id, ids) => {
    const _l = ids.length
    for (i = 0; i < _l; i++)
    {
        if (ids[i] == new_id)
        {
            sheetsapi.updateSingleRow(`C${i+1}`, "X")
            update_attendee_arrival_time(i)
        }
    }
}

const update_attendee_arrival_time = (i) => {
    const today = new Date();

    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    sheetsapi.updateSingleRow(`D${i+1}`, date);
    sheetsapi.updateSingleRow(`E${i+1}`, time);
}


const main = async () => // main flow
{
    attendance_sheet = await get_attendance_sheet()
    student_ids = await get_student_ids_from_sheet(attendance_sheet)
    await update_student_names_to_sheet(student_ids)

    await app.listen(3000, () => {
        console.log("Running on 3000")
        //return 1;
    })

    await app.post("/add_attendee", (req, res) => {
        //console.log("yo " + JSON.stringify(req.body))
        const attendee_id = req.body.data
        res.send({
            status: "success!",
            received: req.body
        })
        update_new_attendee(attendee_id, student_ids)
    });
    
    await app.get("/get_student_ids", (req, res) => {
        res.send({
            status: "success!",
            received: student_ids
        })
    });
    
    await app.get("/get_id_table", (req, res) => {
        res.send({
            status: "success!",
            received: studentId_to_studentName
        })
    });

    //Load everything before serving html(client)
    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/index.html");
    });
    
}

main()











