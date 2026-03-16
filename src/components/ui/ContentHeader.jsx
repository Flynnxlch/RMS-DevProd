import Breadcrumb from './Breadcrumb';

export default function ContentHeader({ title, breadcrumbs = [] }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white m-0 transition-colors">{title}</h1>
        {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      </div>
    </div>
  );
}

