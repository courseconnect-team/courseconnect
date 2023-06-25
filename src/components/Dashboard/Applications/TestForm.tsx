// for admin and faculty views
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import SemesterCheckbox from '@/components/FormUtil/SemesterCheckbox';
import { useAuth } from '@/firebase/auth/auth_context';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function TestForm() {
  // get the current user's uid
  const { user } = useAuth();
  const userId = user.uid;

  // get the current date in month/day/year format
  const current = new Date();
  const current_date = `${
    current.getMonth() + 1
  }/${current.getDate()}/${current.getFullYear()}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);

    // extract availability checkbox's values
    const availabilityCheckbox_seven =
      formData.get('availabilityCheckbox_seven') === 'on';
    const availabilityCheckbox_fourteen =
      formData.get('availabilityCheckbox_fourteen') === 'on';
    const availabilityCheckbox_twenty =
      formData.get('availabilityCheckbox_twenty') === 'on';

    // extract semester checkbox's values
    const semesterCheckbox_summerb_2023 =
      formData.get('semesterCheckbox_summerb_2023') === 'on';
    const semesterCheckbox_fall_2023 =
      formData.get('semesterCheckbox_fall_2023') === 'on';
    const semesterCheckbox_spring_2024 =
      formData.get('semesterCheckbox_spring_2024') === 'on';

    // extract the specific user data from the form data into a parsable object
    const userData = {
      uid: userId,
      date: current_date,
      availability: {
        seven: availabilityCheckbox_seven,
        fourteen: availabilityCheckbox_fourteen,
        twenty: availabilityCheckbox_twenty,
      },
      semesters: {
        summerb_2023: semesterCheckbox_summerb_2023,
        fall_2023: semesterCheckbox_fall_2023,
        spring_2024: semesterCheckbox_spring_2024,
      },
    };

    console.log(userData);
  };
  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          TA/UPI/Grader Application
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Typography align="center" component="h2" variant="h6" sx={{ m: 1 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <AvailabilityCheckbox name="availabilityCheckbox" />
            </Grid>
            <Grid item xs={12}>
              <SemesterCheckbox name="semesterCheckbox" />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
