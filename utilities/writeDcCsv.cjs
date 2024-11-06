const fs = require('fs')
const dcCachePath = 'C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/dcxml/newDcRecords.txt'
/*
For mapping see:
https://docs.google.com/spreadsheets/d/1jya9WBezTJb3HZlRkiwdvg38Exm52THQ/edit?pli=1&gid=1762592894#gid=1762592894
*/
module.exports = function writeDcCsv(manifest) {
    try {
        // Extract values
        let manifestFieldsForDCMap = {
            "InMagic Identifier" : "objid",
            "CIHM Identifier" : "dc:identifier",
            "Alternate Title" : "dc:title", //(must be the second title column in the record)
            "Volume/Issue" : "dc:title", //(we concatenate this field with the main title field)
            "Issue Date" : "dc:date",
            "Coverage Date" : "dc:coverage",
            "Language" : "dc:language",
            "Place of Publication" : "dc:publisher",
            "Publisher" : "dc:publisher",
            "Publication Date" : "dc:publisher",
            "Local Note" : "dc:description",
            "Source" : "dc:source"
        }
        let dcObj = {
            'objid' : '',
            'dc:identifier' : '',
            'dc:title' : manifest['label']['en'], 
            'dc:date' : '',
            'dc:coverage' : '',
            'dc:language' : '',
            'dc:publisher' : '',
            'dc:description' : '',
            'dc:source' : ''
        }
        let altTitle = ''
        for(let fieldTitle in manifestFieldsForDCMap){
            for (let field of manifest["metadata"]) { // Will handle if deleted from manifest well
                if('en' in field['label'] && 'en' in field['value'] ) {
                    if(field['label']['en'][0] === fieldTitle) {
                        if(fieldTitle === "Alternate Title"){
                            altTitle = field['value']['en'] // this is the only field that creates a duplicate
                        } else {
                            // The rest get concatenated
                            if(dcObj[manifestFieldsForDCMap[fieldTitle]].length)
                                dcObj[manifestFieldsForDCMap[fieldTitle]] += " " + field['value']['en'][0]
                            else dcObj[manifestFieldsForDCMap[fieldTitle]] = field['value']['en'][0]
                        }
                    }
                }
            }
        }
        // Write to CSV
        // create if not exist
        let rowTitles = [
            "objid", 
            "dc:title", 
            "dc:title", 
            "dc:creator",
            "dc:language", 
            "dc:coverage", 
            "dc:publisher", 
            "dc:date", 
            "dc:description", 
            "dc:subject",
            "dc:source", 
            "dc:identifier", 
            "dc:relation",
            "dc:rights"
        ]
        if(!fs.existsSync(dcCachePath)) {
            let header = rowTitles.join("*") + "\n"
            fs.writeFileSync(dcCachePath , header , "utf-8")
        }
        // add row data
        let rowValues = [
            dcObj['objid'],
            dcObj['dc:title'],
            altTitle,
            "",
            dcObj['dc:language'],
            dcObj['dc:coverage'],
            dcObj['dc:publisher'],
            dcObj['dc:date'],
            dcObj['dc:description'],
            "",
            dcObj['dc:source'],
            dcObj['dc:identifier'],
            "",
            ""
        ]
        let rowString = rowValues.join("*") + "\n"
        let dcCache = fs.readFileSync(dcCachePath, 'utf-8')
        fs.writeFileSync(dcCachePath , dcCache + rowString, "utf-8")
        return { success: true, message: 'Created DC record' }
    }
    catch (e) {
        console.log(e)
        return { success: false, message: e.message }
    }
}