import {
  Button,
  Dialog,
  Input,
  Portal
} from '@chakra-ui/react'
import { useState } from "react"

export function OpenManifestFromURLMenu() {
  const [value, setValue] = useState('')
  const handleChange = (event: any) => setValue(event.target.value)

  let onOpenPress = () => {
    fetch(value)
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("manifest-data", JSON.stringify(data))
      localStorage.setItem("manifest-id", data.id)
      window.location.reload()
    })
  }

  return (
    <>
      <Dialog.Root>
         <Dialog.Trigger asChild>
            <Button
              colorPalette="gray"
              variant="outline"
              value="manifest-url"
              title="Open Manifest from URL">
                Manifest from URL
            </Button>
          </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger asChild>
              </Dialog.CloseTrigger>
              <Dialog.Header>
                <Dialog.Title>Manifest from a URL</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                You can paste the URL of a Manifest into the field below to open it in the Manifest Editor.
                <Input
                  onChange={handleChange}
                  value={value}
                  placeholder='Paste Manifest URL'
                  size='lg'
                />
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <Button colorPalette="pink" mr={3}>
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  onClick={onOpenPress}
                  colorPalette='pink'>
                    Open
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
