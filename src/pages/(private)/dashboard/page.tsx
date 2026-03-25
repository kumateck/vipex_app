import { largeData } from './data';
import { columns, type User } from './column';
import { DataGrid } from '@/components/datagrid';
import { useCallback, useState } from 'react';

const Dashboard = () => {
  const [data, setData] = useState<User[]>(largeData);

  const handleDeleteRow = useCallback((rowId: string) => {
    setData((prev) => prev.filter((item) => item.id !== rowId));
  }, []);
  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans">
      {/* App Header */}
      {/* <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#002b36] to-[#0f3d4e] rounded flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-800 leading-tight">
              ConsignGrid
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              Logistics Management
            </p>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative pb-24 ">
        <DataGrid
          data={data}
          columns={columns}
          onDataChange={setData}
          onDeleteRow={handleDeleteRow}
          enableSelection={true}
          enableEditing={true}
          getRowId={(row) => row.id}
        />
      </main>
    </div>
  );
};

export default Dashboard;
