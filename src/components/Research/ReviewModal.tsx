import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    SxProps,
} from '@mui/material';
import firebase from '@/firebase/firebase_config';
import { collection, addDoc } from 'firebase/firestore';
import { Theme } from '@emotion/react';
import { v4 as uuidv4 } from 'uuid';


interface FormData {
    item: any
}
/** Initialize all fields to empty strings. */
const ReviewModal: React.FC<FormData> = (
    {
        item
    }
) => {
    const [open, setOpen] = useState(false);

    /** Opens the dialog (modal). */
    const handleOpen = () => {
        setOpen(true);
    };

    /** Closes the dialog (modal).
     *  Note that we do NOT reset the form data here,
     *  so the draft remains if the user reopens the modal.
     */
    const handleClose = () => {
        setOpen(false);
    };
    console.log(item)

    return (
        <div>
            {/* Button to open the modal */}
            <Button onClick={handleOpen} variant="outlined">Review</Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" >
                <DialogTitle>Review Application</DialogTitle>
                <DialogContent>
                    {/* Render each field as a TextField, using the JSON keys as "name" */}
                    {Object.entries(item).map(([key, value]) => (
                        <TextField
                            key={key}
                            name={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={value}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    ))}
                </DialogContent>
                < DialogActions >
                    <Button onClick={handleClose}> Close </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ReviewModal;
