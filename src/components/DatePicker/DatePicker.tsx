import 'react-dates/initialize'
import * as moment from 'moment'
import type { DateRange } from 'constants/types'
import { MdCalendarToday } from 'react-icons/md'
import React, { useCallback, useState } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Translation } from 'components/Translation/Translation'
import { FocusedInputShape, DayPickerRangeController } from 'react-dates'
import { useDisclosure, Button, Flex, HStack, Box } from '@chakra-ui/react'

import 'react-dates/lib/css/_datepicker.css'
import './datepicker_overwrite.css'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'

export type DatePickerProps = {
  selected?: boolean
  setDateRange: Function
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected = false,
  setDateRange = () => {}
}) => {
  const { isMobile } = useThemeProvider()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ focusedInput, setFocusedInput ] = useState<FocusedInputShape | null>('startDate')
  const [ dayRange, setDayRange ] = useState<DateRange>({ startDate: null, endDate: null })

  const onFocusChange = useCallback( (focusedInput: FocusedInputShape | null) => {
    return setFocusedInput(!focusedInput ? 'startDate' : focusedInput)
  }, [setFocusedInput])

  const applyDates = useCallback(() => {
    setDateRange(dayRange)
    return onClose()
  }, [onClose, dayRange, setDateRange])

  return (
    <React.Fragment>
      <Button
        px={4}
        border={0}
        textStyle={'cta'}
        variant={'filter'}
        aria-selected={selected}
        leftIcon={<MdCalendarToday />}
        onClick={() => onOpen()}
      >
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Translation translation={'common.calendar'} />
          {
            selected && (
              <Box
                width={2}
                height={2}
                bg={'cta'}
                borderRadius={'50%'}
              />
            )
          }
        </HStack>
      </Button>
      <Modal
        size={'2xl'}
        isOpen={isOpen}
        onClose={onClose}
        isCentered={!isMobile}
        blockScrollOnMount={false}
      >
        <ModalOverlay />
        <ModalContent>
          <Translation component={ModalHeader} translation={'stats.selectDateRange'} textStyle={'heading'} fontSize={'md'} color={'cta'} />
          <ModalCloseButton />
          <ModalBody>
            <DayPickerRangeController
              endDate={dayRange.endDate}
              maxDate={moment.default()}
              focusedInput={focusedInput}
              startDate={dayRange.startDate}
              numberOfMonths={isMobile ? 1 : 2}
              renderKeyboardShortcutsButton={() => null}
              onDatesChange={(dayRange) => setDayRange(dayRange)}
              initialVisibleMonth={() => moment.default().subtract(1, "M")} 
              isDayBlocked={ (day: moment.Moment) => day.isAfter(moment.default()) }
              onFocusChange={(focusedInput: FocusedInputShape | null) => onFocusChange(focusedInput)}
            />
          </ModalBody>
          <ModalFooter>
            <Flex
              width={'full'}
              justifyContent={'center'}
            >
              <Translation component={Button} translation={'common.apply'} variant={'ctaPrimary'} px={10} onClick={applyDates} />
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </React.Fragment>
  )
}