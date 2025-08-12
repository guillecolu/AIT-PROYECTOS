

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInDays, isBefore, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';
import type { Project, Task, User } from './types';

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

    const addHeader = (doc: jsPDFWithAutoTable) => {
        // Logo
        if (logoUrl) {
            try {
                // This assumes the logo is accessible via fetch, may need adjustment for protected URLs
                // For simplicity, we're not embedding the image from a URL in this example.
                // In a real app, you might need a proxy or to fetch it differently.
            } catch (e) { console.error("Could not add logo to PDF", e); }
        }

        // Title
        doc.setFont('Inter', 'bold');
        doc.setFontSize(16);
        doc.text('Tareas Pendientes – Taller', doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });

        // Metadata
        doc.setFont('Inter', 'normal');
        doc.setFontSize(10);
        const metaDataX = doc.internal.pageSize.getWidth() - 12;
        doc.text(`Proyecto: ${project.numero || ''} - ${project.name}`, metaDataX, 15, { align: 'right' });
        doc.text(`Cliente: ${project.client}`, metaDataX, 20, { align: 'right' });
        doc.text(`Responsable: ${projectManager?.name || 'N/A'}`, metaDataX, 25, { align: 'right' });
        doc.text(`Fecha: ${format(today, 'dd/MM/yyyy HH:mm')}`, metaDataX, 30, { align: 'right' });
        doc.setFont('Inter', 'bold');
        doc.text(`Avance: ${project.progress}%`, metaDataX, 35, { align: 'right' });

        // Separator
        doc.setDrawColor('#E5E7EB');
        doc.line(12, 40, doc.internal.pageSize.getWidth() - 12, 40);
    };

    const addFooter = async (doc: jsPDFWithAutoTable, pageNum: number, totalPages: number) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const qrCodeUrl = `${window.location.origin}/dashboard/projects/${project.id}`;

        // QR Code
        try {
            const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, { errorCorrectionLevel: 'H', width: 24 });
            doc.addImage(qrDataUrl, 'PNG', 12, pageHeight - 28, 24, 24);
        } catch (err) {
            console.error(err);
        }

        // Footer text
        doc.setFont('Inter', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#6B7280');
        doc.text('Documento generado automáticamente por AIT – Gestión de Proyectos. Uso interno.',
            doc.internal.pageSize.getWidth() / 2,
            pageHeight - 10, { align: 'center' });

        // Page number
        doc.text(`Página ${pageNum} de ${totalPages}`,
            doc.internal.pageSize.getWidth() - 12,
            pageHeight - 10, { align: 'right' });
    };
    
    // Summary Cards
    const tasksThisWeek = pendingTasks.filter(t => isBefore(new Date(t.deadline), endOfWeek(today, { weekStartsOn: 1 })));
    const delayedTasks = pendingTasks.filter(t => isBefore(new Date(t.deadline), today));
    const estimatedHours = pendingTasks.reduce((acc, t) => acc + t.estimatedTime, 0);

    const summaryY = 45;
    doc.setFontSize(9);
    doc.text(`Total pendientes: ${pendingTasks.length}`, 12, summaryY);
    doc.text(`Pendientes esta semana: ${tasksThisWeek.length}`, 60, summaryY);
    doc.text(`Retrasadas: ${delayedTasks.length}`, 110, summaryY);
    doc.text(`Horas estimadas pendientes: ${estimatedHours}h`, 150, summaryY);


    const tableData = pendingTasks
        .sort((a, b) => {
            const priorityOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        })
        .map(task => {
        const assignedUser = users.find(u => u.id === task.assignedToId);
        const delay = differenceInDays(today, new Date(task.deadline));
        
        return [
            '', // Checkbox
            task.component,
            task.title,
            assignedUser?.name || 'N/A',
            task.priority,
            format(new Date(task.deadline), 'dd/MM/yy'),
            delay > 0 ? `${delay} días` : '—',
            `${task.estimatedTime}h`,
            'Sí', // Signature required
        ];
    });

    autoTable(doc, {
        head: [['', 'Departamento', 'Tarea', 'Asignado', 'Prioridad', 'Entrega', 'Retraso', 'Horas', 'Firma']],
        body: tableData,
        startY: 58,
        margin: { left: 12, right: 12, top: 45 },
        theme: 'grid',
        styles: {
            font: 'Inter',
            fontSize: 9,
            cellPadding: 2,
            lineColor: '#E5E7EB',
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: '#F5F5F5',
            textColor: '#1F2937',
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: '#FBFBFB'
        },
        columnStyles: {
            0: { cellWidth: 8 }, // Checkbox
            1: { cellWidth: 25 }, // Dept
            2: { cellWidth: 'auto' }, // Tarea
            3: { cellWidth: 25 }, // Asignado
            4: { cellWidth: 15 }, // Prioridad
            5: { cellWidth: 15 }, // Entrega
            6: { cellWidth: 15 }, // Retraso
            7: { cellWidth: 12 }, // Horas
            8: { cellWidth: 12 }, // Firma
        },
        didDrawPage: async (data) => {
            addHeader(doc);
            // We need to await the footer because of the async QRCode generation
            await addFooter(doc, data.pageNumber, doc.internal.pages.length);
        },
    });
    
     // Add final signature section
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('Inter', 'bold');
    doc.text("Firmas de Aprobación", 12, finalY + 20);

    doc.setFontSize(10);
    doc.setFont('Inter', 'normal');
    const signatureY = finalY + 35;
    const signatureX = [12, 80, 150];
    
    doc.line(signatureX[0], signatureY, signatureX[0] + 50, signatureY);
    doc.text("Jefe de Proyecto", signatureX[0], signatureY + 5);
    
    doc.line(signatureX[1], signatureY, signatureX[1] + 50, signatureY);
    doc.text("Jefe de Taller", signatureX[1], signatureY + 5);
    
    doc.line(signatureX[2], signatureY, signatureX[2] + 50, signatureY);
    doc.text("Fecha", signatureX[2], signatureY + 5);


    // This is a workaround to ensure the footer is on the last page if a new page was added by the signature block
    const totalPages = doc.internal.pages.length;
    for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        await addFooter(doc, i, totalPages);
    }


    const filename = `AIT_${project.numero || project.id}_${project.client}_TareasPendientes_${format(today, 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(filename);
};
