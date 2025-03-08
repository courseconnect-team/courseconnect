// components/HeaderCard/HeaderCard.tsx
import React, { FC, ReactNode } from "react"; import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Typography,
    Grid,
} from '@mui/material';
import MoreInfoButton from "./MoreInfoButton";
import LessInfoButton from "./LessInfoButton";

interface ProjectCardProps {
    project_title: string;
    department: string;
    faculty_mentor: string;
    terms_available: string;
    student_level: string;
    project_description: string;
    phd_student_mentor: string;
    prerequisites: string;
    credit: string;
    stipend: string;
    application_requirements: string;
    application_deadline: string;
    website: string;
    children: ReactNode;
}

const ProjectCard: FC<ProjectCardProps> = ({
    project_title,
    department,
    faculty_mentor,
    terms_available,
    student_level,
    project_description,
    phd_student_mentor,
    prerequisites,
    credit,
    stipend,
    application_requirements,
    application_deadline,
    website,
    children
}) => {
    const [expanded, setExpanded] = React.useState(false);
    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };
    return (
        <Card variant="outlined">
            <CardContent>
                {/* Title */}
                <Typography variant="h6">
                    <b>{project_title}</b>
                </Typography>

                {/* Subtitle / Department */}
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {department}
                </Typography>
                <Box height="10px" />

                {/* Basic info */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                        <strong>Faculty Mentor(s):</strong> {faculty_mentor}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Term(s) Available:</strong> {terms_available}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Student Level:</strong> {student_level}
                    </Typography>
                    <Box />
                    <Typography variant="body2">
                        {project_description}
                    </Typography>
                    <Box />
                </Box>
                <Box height="20px" />
                {!expanded && (
                    <MoreInfoButton onClick={handleToggleExpand} />
                )}

                {expanded && (
                    <>
                        <LessInfoButton onClick={handleToggleExpand} />
                        <Box height="10px" />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2">
                                <strong>Ph.D Student Mentor(s):</strong> {phd_student_mentor}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Prerequisite(s):</strong> {prerequisites}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Credit</strong> {credit}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Stipend</strong> {stipend}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Application Requirements</strong> {application_requirements}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Application Deadline</strong> {application_deadline}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Website</strong> <a href={`${website}`}>{website}</a>
                            </Typography>
                            <Box />
                        </Box>
                    </>
                )}
                <Box height="20px" />
                {children}
            </CardContent>
        </Card>

    );
};

export default ProjectCard;
