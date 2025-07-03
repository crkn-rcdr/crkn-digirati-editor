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
    useDisclosure
  } from '@chakra-ui/react'
  import { useEffect, useState } from "react"
  
  export function WipSettingsMenu() {
    const { isOpen, onOpen, onClose } = useDisclosure()
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
      if (isOpen) {
        window.electronAPI.getWipPath()
          .then ( res => { 
            try {
              if(res) setData(res as any)
            } catch (e) {
              console.log("error getting local manifest")
            }
          })
      } 
    }, [isOpen])

    return (
      <>
        <MenuItem
          onClick={onOpen}
          title="WIP Settings">
            WIP Settings
        </MenuItem>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>WIP Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <p>WIP Folder: {data}</p>
              <Button onClick={onSet}>Select a WIP folder</Button>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }