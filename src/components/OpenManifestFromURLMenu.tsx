import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  MenuItem, 
  Input,
  useDisclosure 
} from '@chakra-ui/react'
import { useState } from "react"

export function OpenManifestFromURLMenu() {
  const { isOpen, onOpen, onClose } = useDisclosure()
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
        onClick={onOpen}
        title="Open Manifest from URL">
          Open Project from URL
      </MenuItem>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Open a Manifest from a URL</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            You can paste the URL of a Manifest into the field below to open it in the Manifest Editor.
            <Input
              onChange={handleChange}
              value={value}
              placeholder='Paste Manifest URL'
              size='lg'
            />
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onOpenPress}
              colorScheme='pink'>
                Open
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}