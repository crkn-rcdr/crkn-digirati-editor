import {
  Button,
  CloseButton,
  Dialog,
  Input,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react'
import { useState } from "react"

export function OpenManifestFromURLMenu() {
  const { open, setOpen, onOpen } = useDisclosure()
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
      <MenuItem
        value="manifest-url"
        onSelect={onOpen}
        title="Open Manifest from URL">
          Manifest from URL
      </MenuItem>

      <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
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
      </Dialog.Root>
    </>
  )
}
