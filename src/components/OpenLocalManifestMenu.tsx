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
    useDisclosure, 
    List,
    ListItem,
    HStack
  } from '@chakra-ui/react'
  import { useEffect, useState } from "react"
  
  export function OpenLocalManifestMenu() {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [data, setData] = useState([])
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    let onItemPress = (item : any) => {
      /* Get Item  */
      window.electronAPI.getManifestLocally(item)
        .then ( data => { // {result, data}
          try {
            console.log("Result", data)
            localStorage.setItem("manifest-data", JSON.stringify(data))
            localStorage.setItem("manifest-id", data.id)
            window.location.reload()
          } catch (e) {
            console.log("error getting local manifest")
          }
        })
    }

    useEffect(() => {
      if (isOpen) {
        window.electronAPI.listManifestLocally()
          .then ( res => {
            try {
              console.log("res", res)
              if(res) setData(res as any)
            } catch (e) {
              console.log(e)
            }
        })
      } 
    }, [isOpen])

    // Get the current page data
    const currentData = data ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : []

    // Handle page change
    const handlePageChange = (pageNumber : any) => {
      setCurrentPage(pageNumber)
    };

    // Calculate total pages
    const totalPages = data?.length ? Math.ceil(data.length / itemsPerPage) : 0
    
  
    return (
      <>
        <MenuItem
          onClick={onOpen}
          title="Open Recent Local Manifests">
            Open Recent
        </MenuItem>
  
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Open Recent</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {currentData?.length ? 
                <>
                <List spacing={3}>
                  {currentData.map((item, index) => (
                    <ListItem 
                    onClick={() => { onItemPress(item) }}
                    key={index} 
                    p={3} 
                    borderWidth={1} 
                    borderRadius="md">
                      {item}
                    </ListItem>
                  ))}
                </List>

                {/* Pagination Controls */}
                <HStack spacing={4} mt={4} justify="center">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </HStack>
                </> : "No recent manifests" }
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }