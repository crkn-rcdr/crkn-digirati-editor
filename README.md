# CRKN digirati Editor
The CRKN Digirati Editor is a minimal desktop application created to support CRKN's adoption of the [Digirati Manifest Editor](https://github.com/digirati-co-uk/iiif-manifest-editor). The Digirati manifest editor is a an open-source, IIIF editing tool, the Manifest Editor is designed to provide a visually intuitive tool for creating, editing and updating IIIF Manifests and more. The manifest editor is central to the CRKN digitization process, allowing digitization staff to add items to our IIIF API, cataloging staff to browse the content for metadata creation, and for user support staff to correct any issues, like mistakes in the ordering of pages. ​With the digirati editor CRKN staff can re-order pages, add labels and summaries, add metadata, add alternative representations, and more! ​Digirati's manifest editor provides all the complex editing features we needed, and even supports French and English labeling, all in a user-friendly way. This took the load off our small team of developers.

In this repo:
- CRKN has been able to use Digirati's [published manifest editor NPM modules](https://www.npmjs.com/package/manifest-editor) to integrate IIIF into their digitization workflow at the earliest and most convenient stages possible for staff. ​
- By wrapping Digirati's manifest editor react components within an electron desktop application, our non-technical digitizaters can create and edit manifests directly from folders of images on their computer. ​
- Our developers were also able to take advantage of the digirati editor's out of the box functionality which let CRKN staff open items on the internet archive, or existing content in the CRKN collections. ​
- We were easily able to create a button for saving content to our IIIF API and image Object storage for permanent storage and display. 

# Electron Desktop App 
To run the desktop app for development, run this command:
```
npm run start
```

To create an executable to run a the computer independantly, run:
```
npm run publish
```
This command will create an executable and distribute it to a new GitHub release.


# React + TypeScript + Vite Front-End
All of the content within the desktop application is created using a React/Vite app defined in the /src directory.
The front-end needs to be compiled into distribution code found in the /dist directory, as this is where the desktop app looks for content.
To build the front-end code run this command:
```
npm run build
```
