
// import { FC } from 'react';
// import PageLayout from '@/newcomponents/PageLayout/PageLayout';
// import { getNavItems } from '@/hooks/useGetItems';
// import { useUserInfo } from '@/hooks/User/useGetUserInfo';

// const ApplicationsPage: FC = () => {

//   const [user, role, loading, roleError] = useUserInfo();

// if (roleError) return <p>Error loading role</p>;
// if (!user) return <p>Please sign in.</p>;
// if (role !== 'faculty' && role !== 'admin') return <p>Not authorized.</p>;

// if (isLoading || loading) return <LinearProgress />;
// if (error || roleError)
//     return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;
// if (!course)
//     return (
//       <PageLayout mainTitle="Course not Found" navItems={getNavItems(role)} />
//     );
//     return(
//         <PageLayout mainTitle={""} navItems={getNavItems(role)>

//         </PageLayout>
//     )
// }