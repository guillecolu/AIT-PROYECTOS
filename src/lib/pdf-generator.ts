

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInDays, isBefore, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Project, Task, User, TaskComponent } from './types';
import qrcode from 'qrcode';


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const generatePendingTasksPdf = async (project: Project, tasks: Task[], users: User[], logoUrl: string | null) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    }) as jsPDFWithAutoTable;

    const projectManager = users.find(u => u.id === project.projectManagerId);
    const pendingTasks = tasks.filter(t => t.status !== 'finalizada');
    const today = new Date();

    const M = { l: 12, r: 12, t: 18, b: 12 };

    const addHeader = (doc: jsPDFWithAutoTable) => {
        // Title
        doc.setFont('Inter', 'bold');
        doc.setFontSize(16);
        doc.text('Tareas Pendientes – Taller', doc.internal.pageSize.getWidth() / 2, M.t, { align: 'center' });

        // Metadata
        doc.setFont('Inter', 'normal');
        doc.setFontSize(10);
        const rightX = doc.internal.pageSize.getWidth() - M.r;

        doc.text(`Proyecto: ${project.numero || ''} - ${project.name}`, M.l, M.t + 8);
        doc.text(`Cliente: ${project.client}`, M.l, M.t + 13);
        
        doc.text(`Responsable: ${projectManager?.name || 'N/A'}`, rightX, M.t + 8, { align: 'right' });
        doc.text(`Fecha: ${format(today, 'dd/MM/yyyy HH:mm')}`, rightX, M.t + 13, { align: 'right' });
        doc.setFont('Inter', 'bold');
        doc.text(`Avance: ${project.progress}%`, rightX, M.t + 18, { align: 'right' });


        // Separator
        doc.setDrawColor('#E5E7EB');
        doc.line(M.l, M.t + 22, doc.internal.pageSize.getWidth() - M.r, M.t + 22);
    };

    const addFooter = async (doc: jsPDFWithAutoTable, pageNum: number, totalPages: number) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const rightX = doc.internal.pageSize.getWidth() - M.r;

        // Footer text
        doc.setFont('Inter', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#6B7280');
        doc.text('Documento interno AIT – Generado automáticamente', M.l, pageHeight - M.b + 6);
        
        // QR Code
        const projectUrl = `${window.location.origin}/dashboard/projects/${project.id}`;
        const qrCodeDataUrl = await qrcode.toDataURL(projectUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 70
        });
        doc.addImage(qrCodeDataUrl, 'PNG', rightX - 20, pageHeight - M.b, 20, 20);

        // Page number
        doc.text(`Página ${pageNum} de ${totalPages}`, rightX - 22, pageHeight - M.b + 6, { align: 'right' });
    };
    
    // Summary Cards
    const tasksThisWeek = pendingTasks.filter(t => isBefore(new Date(t.deadline), endOfWeek(today, { weekStartsOn: 1 })));
    const delayedTasksCount = pendingTasks.filter(t => isBefore(new Date(t.deadline), today)).length;
    const estimatedHours = pendingTasks.reduce((acc, t) => acc + t.estimatedTime, 0);

    const summaryY = M.t + 28;
    doc.setFontSize(10);
    doc.setTextColor('#1F2937');
    const summaryText = `Total: ${pendingTasks.length}    Pendientes semana: ${tasksThisWeek.length}    Retrasadas: ${delayedTasksCount}    Horas pendientes: ${estimatedHours}h`;
    doc.text(summaryText, M.l, summaryY);

    const groupedTasks: Record<string, Task[]> = pendingTasks.reduce((acc, task) => {
        const dept = task.component || 'Sin Departamento';
        if (!acc[dept]) {
            acc[dept] = [];
        }
        acc[dept].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    let tableBody: any[] = [];
    const priorityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };

    Object.keys(groupedTasks).sort().forEach(dept => {
        // Add a group header row
        tableBody.push([{
            content: dept,
            colSpan: 8,
            styles: {
                fillColor: '#FAD4D4',
                textColor: '#BE1E2D',
                fontStyle: 'bold',
                halign: 'left'
            }
        }]);

        // Sort tasks within the group
        const sortedTasks = groupedTasks[dept].sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 4;
            const priorityB = priorityOrder[b.priority] || 4;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        // Add task rows
        sortedTasks.forEach(task => {
            const assignedUser = users.find(u => u.id === task.assignedToId);
            const delay = differenceInDays(today, new Date(task.deadline));
            
            tableBody.push([
                task.component,
                task.title,
                assignedUser?.name || 'N/A',
                task.priority,
                format(new Date(task.deadline), 'dd/MM/yy'),
                delay > 0 ? `${delay} días` : '—',
                `${task.estimatedTime}h`,
                'Sí',
            ]);
        });
    });


    autoTable(doc, {
        head: [['Departamento', 'Tarea', 'Asignado', 'Prioridad', 'Entrega', 'Retraso', 'Horas', 'Firma']],
        body: tableBody,
        startY: M.t + 34,
        margin: { left: M.l, right: M.r },
        theme: 'grid',
        styles: {
            font: 'Inter',
            fontSize: 9,
            cellPadding: 3,
            lineColor: '#E5E7EB',
            lineWidth: 0.1,
            overflow: 'linebreak',
            minCellHeight: 6,
        },
        headStyles: {
            fillColor: '#F5F5F5',
            textColor: '#1F2937',
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: '#FBFBFB'
        },
        columnStyles: {
            0: { cellWidth: 28 }, // Dept
            1: { cellWidth: 52 }, // Tarea
            2: { cellWidth: 24 }, // Asignado
            3: { cellWidth: 18 }, // Prioridad
            4: { cellWidth: 20 }, // Entrega
            5: { cellWidth: 16, halign: 'right' }, // Retraso
            6: { cellWidth: 14, halign: 'right' }, // Horas
            7: { cellWidth: 14, halign: 'center' }, // Firma
        },
        didParseCell: (data) => {
            // High priority styling
            if (data.column.dataKey === 3 && data.cell.raw === 'Alta') {
                data.cell.styles.textColor = '#BE1E2D';
                data.cell.styles.fontStyle = 'bold';
            }
             // Delay styling
            if (data.column.dataKey === 5 && (data.cell.raw as string).includes('días')) {
                data.cell.styles.textColor = '#A46B00';
            }
        },
        didDrawPage: async (data) => {
            addHeader(doc);
            await addFooter(doc, data.pageNumber, (doc.internal as any).pages.length);
        },
    });
    
    // Ensure footer is on all pages
    const totalPages = (doc.internal as any).pages.length;
    for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        await addFooter(doc, i, totalPages);
    }

    const filename = `AIT_${project.numero || project.id}_${project.client}_TareasPendientes_${format(today, 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(filename);
};
