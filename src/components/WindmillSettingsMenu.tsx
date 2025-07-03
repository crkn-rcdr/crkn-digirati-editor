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
  
  export function WindmillSettingsMenu() {
    const { isOpen, onOpen, onClose } = useDisclosure()
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
        <MenuItem
          onClick={onOpen}
          title="Windmill Settings">
            Windmill Settings
        </MenuItem>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Windmill Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              Paste in the Windmill Profile you received from your system administrator.
              <Input
                onChange={handleChange}
                value={value}
                placeholder='Paste Windmill Profile'
                size='lg'
              />
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={onSet}
                colorScheme='pink'>
                  Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }