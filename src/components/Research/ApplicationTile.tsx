import React from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Avatar,
    IconButton,
    Button,
    Paper,
    Stack,
} from "@mui/material";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";


interface ApplicationTileProps {
    item: any;
    status: "Pending" | "Approved" | "Denied";
    changeStatus: (id: string, app_status: string) => Promise<void>;
}

const ApplicationTile: React.FC<ApplicationTileProps> = ({
    item,
    status,
    changeStatus,
}) => {
    return (
        <Paper
            key={item.email + status}
            variant="outlined"
            sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                mb: 1,
                borderColor:
                    status === "Pending"
                        ? "grey.300"
                        : status === "Approved"
                            ? "success.light"
                            : "error.light",
            }}
        >
            <Avatar sx={{ mr: 2 }}>{item?.firstname[0] || "" + item?.lastname[0] || ""}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {item.email}
                </Typography>
            </Box>
            {status === "Pending" && (
                <Stack direction="row" spacing={1}>
                    <IconButton color="success" onClick={() => changeStatus(item.id, "Approved")}>
                        <ThumbUpAltOutlinedIcon />
                    </IconButton>
                    <IconButton color="error">
                        <ThumbDownAltOutlinedIcon onClick={() => changeStatus(item.id, "Denied")}/>
                    </IconButton>
                    <Button variant="outlined">Review</Button>
                </Stack>
            )}
            {status === "Approved" && (
                <Typography variant="body1" color="success.main">
                    Approved
                </Typography>
            )}
            {status === "Denied" && (
                <Typography variant="body1" color="error.main">
                    Denied
                </Typography>
            )}
        </Paper>
    );
};

export default ApplicationTile;