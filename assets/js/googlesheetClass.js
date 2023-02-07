const {
    google
} = require("googleapis");

auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});
class GoogleSheetsAPI 
{
    constructor(Sheetname)
    {
        this.Sheetname = Sheetname
        this.spreadsheetId = "1OTi8tMuy-W6-AzbL-HUYmKL4Hj6G-iKRSKa9qfWFUkQ"
    }
    
    

    getSpreadsheet = async () => {
        const client = await auth.getClient
    
        const googleSheets = google.sheets({
            version: "v4",
            auth: client
        });
    
        const spreadsheetId = this.spreadsheetId
    
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: this.Sheetname,
        })
        return getRows
    }

    updateSingleRow = async (target, newVaue) => {

        const client = await auth.getClient
      
        const googleSheets = google.sheets({ version: "v4", auth: client });
      
        const spreadsheetId = this.spreadsheetId
      
        await googleSheets.spreadsheets.values.update({
          auth,
          spreadsheetId,
          range: `${this.Sheetname}!${target}`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [newVaue],
            ]
          }
        })
      
      }
}

module.exports = { GoogleSheetsAPI }