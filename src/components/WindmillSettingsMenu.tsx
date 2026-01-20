import {
    Button,
    CloseButton,
    Dialog,
    Input,
    Portal,
  } from '@chakra-ui/react'
  import { useState } from "react"
  
  export function WindmillSettingsMenu() {
    const [value, setValue] = useState('')
    const handleChange = (event: any) => setValue(event.target.value)

    let onSet = () => {
      window.electronAPI.setWindmill({windmill: value})
        .then ( res => { 
          try {
            if(res) console.log("success setting Windmill")
          } catch (e) {
            console.log("error setting Windmill")
          }
        })
    }

    return (
      <>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button 
              colorPalette="gray"
              variant="outline"
              title="Open a dialog to edit Windmill Settings">
                Windmill Settings
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
                <Dialog.Header>
                  <Dialog.Title>Windmill Settings</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  Paste in the Windmill Profile you received from your system administrator.
                  <Input
                    onChange={handleChange}
                    value={value}
                    placeholder='Paste Windmill Profile'
                    size='lg'
                  />
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.CloseTrigger asChild>
                  </Dialog.CloseTrigger>
                  <Button
                    onClick={onSet}
                    colorPalette='pink'>
                      Save
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </>
    )
  }
