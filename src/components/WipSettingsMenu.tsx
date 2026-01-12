import {
    Button,
    CloseButton,
    Dialog,
  } from '@chakra-ui/react'
  import { useEffect, useState } from "react"
  
  export function WipSettingsMenu() {
    const [data, setData] = useState([])

    let onSet = () => {
      window.electronAPI.setWipPath()
        .then ( res => { 
          try {
            if(res) setData(res as any)
          } catch (e) {
            console.log("error setting WIP")
          }
        })
    }

    useEffect(() => {
        window.electronAPI.getWipPath()
          .then ( res => { 
            try {
              if(res) setData(res as any)
            } catch (e) {
              console.log("error getting local manifest")
            }
          })
    })

    return (
      <>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button 
              colorPalette="gray"
              variant="subtle"
              title="Open a dialog to edit WIP Settings">
                WIP Settings
            </Button>
          </Dialog.Trigger>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
              <Dialog.Header>
                <Dialog.Title>WIP Settings</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>WIP Folder: {data}</p>
                <Button  colorPalette="pink" onClick={onSet}>Select a WIP folder</Button>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                </Dialog.CloseTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </>
    )
  }
