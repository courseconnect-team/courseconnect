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

interface UserItem {
    name: string;
    email: string;
}

interface ApplicationTileProps {
    item: UserItem;
    status: "needs" | "approved" | "denied";
}

function getInitials(name: string): string {
    const parts = name.split(" ");
    const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");
    return initials;
  }

const ApplicationTile: React.FC<ApplicationTileProps> = ({
    item,
    status
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
                    status === "needs"
                        ? "grey.300"
                        : status === "approved"
                            ? "success.light"
                            : "error.light",
            }}
        >
            <Avatar sx={{ mr: 2 }}>{getInitials(item.name)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {item.email}
                </Typography>
            </Box>
            {status === "needs" && (
                <Stack direction="row" spacing={1}>
                    <IconButton color="success">
                        <ThumbUpAltOutlinedIcon />
                    </IconButton>
                    <IconButton color="error">
                        <ThumbDownAltOutlinedIcon />
                    </IconButton>
                    <Button variant="outlined">Review</Button>
                </Stack>
            )}
            {status === "approved" && (
                <Typography variant="body1" color="success.main">
                    Approved
                </Typography>
            )}
            {status === "denied" && (
                <Typography variant="body1" color="error.main">
                    Denied
                </Typography>
            )}
        </Paper>
    );
};

export default ApplicationTile;