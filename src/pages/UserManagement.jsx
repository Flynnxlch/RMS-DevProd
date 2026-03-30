import ContentHeader from '../components/ui/ContentHeader';
import UserList from '../components/adm/UserList';
import UserRequest from '../components/adm/UserRequest';

export default function UserManagement() {
  return (
    <>
      <ContentHeader
        title="Manajemen Pengguna"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Manajemen Pengguna' },
        ]}
      />

      <div className="space-y-4">
        <UserRequest />
        <UserList />
      </div>
    </>
  );
}
