/*
CIHM - Identifier = objid
TI - Title = dc:title
AT - Alternate Title = dc:title (must be the second title column in the record)
ISS - Volume/Issue = dc:title (we concatenate this field with the main title field)
IssueDate - Issue Date = dc:date
Lang - Language = dc:language
PL - Place of Publication = dc:publisher
Pub - Publisher = dc:publisher
DT - Publication Date = dc:publisher (PL, Pub, DT are all concatenated)
Local - Local Note = Occasionally has something I will put in dc:description, but not always.
533 - Source = dc:source

Pages - Number of pages = NOT USED IN DC
Images - Number of Images = NOT USED IN DC
CO - Unsure (this isn't a public field) = NOT USED IN DC
SD - Unsure (this isn't a public field) = NOT USED IN DC
LIBR - Source Code = NOT USED IN DC
DPI - Dots Per Inch = NOT USED IN DC
All of this info is found in the CRKN DC schema documentation on the final tab
https://docs.google.com/spreadsheets/d/1jya9WBezTJb3HZlRkiwdvg38Exm52THQ/edit?pli=1&gid=1762592894#gid=1762592894

InMagic Identifier
CIHM Identifier
Title - Manifest label
Alternate Title
Volume/Issue
Issue Date
Language
Place of Publication
Publisher
Publication Date
Local Note
Number of Pages
Number of Images
LIBR Source Code
Dots per Inch
Source
Scan Date
*/

let titleField = "label" // dc:title (must be the second title column in the record)
let manifestFieldsForDC = [
    "InMagic Identifier", // objid
    "CIHM Identifier", // dc:identifier 
    "Alternate Title", // dc:title (must be the second title column in the record)
    "Volume/Issue", // dc:title (we concatenate this field with the main title field)
    "Issue Date", // dc:date
    "Coverage Date", // dc:coverage
    "Language", // dc:language
    "Place of Publication", // dc:publisher
    "Publisher", // dc:publisher
    "Publication Date", // dc:publisher
    "Local Note", // dc:description
    "Source" // dc:source
]
let electronFs = require('fs')
module.exports = function writeDcXml(manifest) {
    let dcObj = {
        'objid' : '',
        'identifier' : '',
        'title' : '',
        'date' : '',
        'coverage' : '',
        'language' : '',
        'publisher' : '',
        'description' : '',
        'source' : ''
    }
    `
    <?xml version="1.0" encoding="UTF-8"?>
    <metadata
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${dcObj['title']}</dc:title>
        <dc:subject>${dcObj['title']}</dc:subject>
        <dc:description>$dcObj['title']}</dc:description>
        <dc:publisher>${dcObj['title']}</dc:publisher>
        <dc:contributor>${dcObj['title']}</dc:contributor>
        <dc:date>${dcObj['title']}</dc:date>
        <dc:type>${dcObj['title']}</dc:type>
        <dc:format>${dcObj['title']}</dc:format>
        <dc:identifier>${dcObj['title']}</dc:identifier>
        <dc:source>${dcObj['title']}</dc:source>
        <dc:language>${dcObj['title']}</dc:language>
        <dc:relation>${dcObj['title']}</dc:relation>
        <dc:coverage>${dcObj['title']}</dc:coverage>
        <dc:rights>${dcObj['title']}</dc:rights>
    </metadata>
    `
    return true
}