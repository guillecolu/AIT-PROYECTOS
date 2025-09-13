
import { format, differenceInDays, isBefore, endOfWeek, startOfDay, endOfDay, subDays, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Project, Task, User, Part, AreaColor, TaskStatus } from './types';
import type { PdfSelection } from '@/components/projects/pdf-options-modal';
import { toast } from '@/hooks/use-toast';
import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDFWithAutoTable;
}

const addPdfFooter = async (doc: jsPDFWithAutoTable, pageNum: number, totalPages: number, logoUrl: string | null) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const M = { l: 12, r: 12, t: 18, b: 12 };
    
    doc.setFontSize(8);
    doc.setFont('Inter', 'normal');
    doc.setTextColor('#6B7280');
    
    const footerText = `Página ${pageNum} de ${totalPages}`;
    doc.text(footerText, pageWidth / 2, pageHeight - M.b + 8, { align: 'center' });

    if (logoUrl) {
        try {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            doc.addImage(dataUrl, 'PNG', M.l, pageHeight - M.b + 2, 30, 10);
        } catch (error) {
            console.error("Error loading logo for PDF footer:", error);
        }
    }
};

const addPdfHeader = async (doc: jsPDFWithAutoTable, project: Project, users: User[]) => {
    const M = { l: 14, r: 14, t: 18, b: 12 };
    const pageWidth = doc.internal.pageSize.getWidth();
    let lastY = M.t;
    const projectManager = users.find(u => u.id === project.projectManagerId);

    doc.setFont('Inter', 'bold');
    doc.setFontSize(16);
    doc.text('Tareas Pendientes', pageWidth / 2, lastY, { align: 'center' });
    lastY += 8;

    doc.setFont('Inter', 'normal');
    doc.setFontSize(10);
    
    let leftY = lastY;
    doc.text(`Proyecto: ${project.numero || ''} - ${project.name}`, M.l, leftY);
    leftY += 5;
    doc.text(`Cliente: ${project.client}`, M.l, leftY);

    if (projectManager) {
        let rightY = lastY;
        doc.text(`Jefe de Proyecto: ${projectManager.name}`, pageWidth - M.r, rightY, { align: 'right' });
    }
    
    const finalY = Math.max(leftY, lastY + (projectManager ? 5 : 0));
    
    doc.setDrawColor('#E5E7EB');
    doc.line(M.l, finalY + 3, pageWidth - M.r, finalY + 3);

    return finalY + 5; // Return the Y position for the table to start
}


export const generateGlobalSummaryPdf = async (projects: Project[], allTasks: Task[], allUsers: User[], logoUrl: string | null) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    }) as jsPDFWithAutoTable;

    const M = { l: 12, r: 12, t: 18, b: 12 };
    let isFirstPage = true;
    let finalY = 0;

    for (const project of projects) {
        const projectTasks = allTasks.filter(t => t.projectId === project.id && t.status !== 'finalizada');
        if (projectTasks.length === 0) continue;

        const title = "TAREAS PENDIENTES";
        const subtitle = project.name;

        const groupedTasks: Record<string, Record<string, Task[]>> = projectTasks.reduce((acc, task) => {
            const partName = `${project.parts.find(p => p.id === task.partId)?.name}`.trim() || 'Parte Desconocido';
            const areaName = task.component || 'Sin Área';
            if (!acc[partName]) acc[partName] = {};
            if (!acc[partName][areaName]) acc[partName][areaName] = [];
            acc[partName][areaName].push(task);
            return acc;
        }, {} as Record<string, Record<string, Task[]>>);

        const tableBody: any[] = [];
        Object.keys(groupedTasks).sort().forEach(partName => {
            tableBody.push([{ content: partName, colSpan: 4, styles: { fillColor: '#374151', textColor: '#FFFFFF', fontStyle: 'bold' } }]);
            const areas = groupedTasks[partName];
            Object.keys(areas).sort().forEach(areaName => {
                tableBody.push([{ content: areaName, colSpan: 4, styles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold' } }]);
                areas[areaName].forEach(task => {
                    const assignedUser = allUsers.find(u => u.id === task.assignedToId);
                    tableBody.push([
                        task.title,
                        assignedUser?.name || 'N/A',
                        format(new Date(task.deadline), 'dd/MM/yy'),
                        task.status.replace('-', ' ')
                    ]);
                });
            });
        });
        
        let startY = isFirstPage ? M.t : finalY + 15;
        
        if (!isFirstPage && startY + 20 > doc.internal.pageSize.height) { 
            doc.addPage();
            startY = M.t;
        }

        autoTable(doc, {
            head: [['Tarea', 'Asignado', 'Entrega', 'Estado']],
            body: tableBody,
            startY: startY + 18,
            margin: { left: M.l, right: M.r },
            theme: 'grid',
            headStyles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold' },
            didDrawPage: (data) => {
                 doc.setFont('Inter', 'bold');
                doc.setFontSize(16);
                doc.text(title, doc.internal.pageSize.getWidth() / 2, M.t, { align: 'center' });
            
                if (subtitle) {
                    doc.setFont('Inter', 'normal');
                    doc.setFontSize(10);
                    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, M.t + 6, { align: 'center' });
                }
            
                doc.setDrawColor('#E5E7EB');
                doc.line(M.l, M.t + 12, doc.internal.pageSize.getWidth() - M.r, M.t + 12);
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
            }
        });
        
        finalY = (doc as any).lastAutoTable.finalY;
        isFirstPage = false;
    }
    
    const totalPages = (doc.internal as any).pages.length || doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        await addPdfFooter(doc, i, totalPages, logoUrl);
    }
    
    const filename = `Resumen_Global_Pendientes_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
};



export const generatePendingTasksPdf = async (project: Project, tasks: Task[], users: User[], logoUrl: string | null, areaColors: AreaColor[] | null, selection: PdfSelection) => {
    // Dynamic imports for client-side libraries
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    }) as jsPDFWithAutoTable;
    
    const pendingTasks = tasks.filter(t => {
        if (t.status === 'finalizada') return false;
        const partId = t.partId;
        const componentName = t.component;
        return selection[partId] && selection[partId][componentName] === true;
    });

    if (pendingTasks.length === 0) {
        toast({
            variant: "destructive",
            title: "No hay tareas para exportar",
            description: "No se encontraron tareas pendientes para las áreas seleccionadas.",
        });
        return;
    }

    const getPartName = (partId: string) => project.parts?.find(p => p.id === partId)?.name || `Parte (ID: ${partId})`;
    const groupedTasks: Record<string, Record<string, Task[]>> = pendingTasks.reduce((acc, task) => {
        const partId = task.partId;
        const deptName = task.component || 'Sin Área';
        if (!acc[partId]) acc[partId] = {};
        if (!acc[partId][deptName]) acc[partId][deptName] = [];
        acc[partId][deptName].push(task);
        return acc;
    }, {} as Record<string, Record<string, Task[]>>);

    const priorityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
    const defaultColor = areaColors?.find(c => c.name === 'default');

    const tableBody: any[] = [];
    Object.keys(groupedTasks).sort().forEach(partId => {
        const partName = getPartName(partId);
        tableBody.push([{ content: partName, colSpan: 7, styles: { fillColor: '#374151', textColor: '#FFFFFF', fontStyle: 'bold', halign: 'left' } }]);
        const depts = groupedTasks[partId];

        Object.keys(depts).sort().forEach(deptName => {
            const colors = areaColors?.find(c => c.name === deptName) || defaultColor;
            tableBody.push([{ content: deptName, colSpan: 7, styles: { fillColor: colors?.pdfFillColor || '#E5E7EB', textColor: colors?.pdfTextColor || '#1F2937', fontStyle: 'bold', halign: 'left' } }]);

            const sortedTasks = depts[deptName].sort((a, b) => {
                const priorityA = priorityOrder[a.priority] || 4;
                const priorityB = priorityOrder[b.priority] || 4;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });

            sortedTasks.forEach(task => {
                const assignedUser = users.find(u => u.id === task.assignedToId);
                const delay = differenceInDays(new Date(), new Date(task.deadline));
                tableBody.push([
                    task.title, 
                    assignedUser?.name || 'N/A', 
                    task.priority, 
                    format(new Date(task.deadline), 'dd/MM/yy'), 
                    delay > 0 ? `${delay} días` : '—', 
                    `${task.estimatedTime}h`, 
                    ''
                ]);
            });
        });
    });

    const M = { l: 14, r: 14, t: 18, b: 12 };
    
    let firstPageHeaderY = M.t + 20; // Default startY
    
    autoTable(doc, {
        head: [['Tarea', 'Asignado', 'Prioridad', 'Entrega', 'Retraso', 'Horas', 'Firma']],
        body: tableBody,
        startY: firstPageHeaderY,
        margin: { left: M.l, right: M.r, bottom: M.b + 10 },
        theme: 'grid',
        showHead: 'everyPage',
        headStyles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold' },
        didDrawPage: async (data) => {
            if (data.pageNumber === 1) {
                const headerY = await addPdfHeader(doc, project, users);
                data.settings.startY = headerY; // Set startY for the first page table
            }
        },
        willDrawCell: (data) => {
            const isPartHeader = data.row.raw[0]?.styles?.fillColor === '#374151';
            const isDeptHeader = !isPartHeader && data.row.cells[0]?.colSpan === 7;

            if (isPartHeader || isDeptHeader) {
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            }
        },
        didParseCell: (data: any) => {
            if (data.row.raw[0]?.styles?.fillColor) return;
            if (data.column.dataKey === 2 && data.cell.raw === 'Alta') { data.cell.styles.textColor = '#BE1E2D'; data.cell.styles.fontStyle = 'bold'; }
            if (data.column.dataKey === 4 && (data.cell.raw as string).includes('días')) { data.cell.styles.textColor = '#A46B00'; }
        },
        columnStyles: { 
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 25, halign: 'left' },
            2: { cellWidth: 22, halign: 'left' },
            3: { cellWidth: 18, halign: 'left' },
            4: { cellWidth: 18, halign: 'right' },
            5: { cellWidth: 14, halign: 'right' },
            6: { cellWidth: 14, halign: 'center' }
        },
    });

    const totalPages = (doc.internal as any).pages.length || doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        await addPdfFooter(doc, i, totalPages, logoUrl);
    }

    const filename = `AIT_${project.numero || project.id}_${project.client}_TareasPendientes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(filename);
};


export const generateUserTasksPdf = async (
    users: User[],
    allTasks: Task[],
    allProjects: Project[],
    logoUrl: string | null
) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    }) as jsPDFWithAutoTable;

    const M = { l: 12, r: 12, t: 18, b: 12 };
    
    const today = new Date();
    const dayOfWeek = getDay(today);
    const diff = (dayOfWeek - 5 + 7) % 7; 
    const weekStart = startOfDay(subDays(today, diff));
    const weekEnd = endOfDay(addDays(weekStart, 6)); 

    const dayColors: Record<number, string> = {
        1: '#DBEAFE', // Lunes (Blue)
        2: '#D1FAE5', // Martes (Green)
        3: '#FEF3C7', // Miércoles (Yellow)
        4: '#FCE7F3', // Jueves (Pink)
        5: '#FEE2E2', // Viernes (Red)
    };

    let printedUsersCount = 0;

    users.forEach((user, i) => {
        const userTasks = allTasks.filter(t => {
            if (t.assignedToId !== user.id || t.status === 'finalizada') {
                return false;
            }
            const deadline = new Date(t.deadline);
            const day = getDay(deadline);
            return deadline >= weekStart && deadline <= weekEnd && day > 0 && day < 6;
        });

        if (userTasks.length === 0) return;

        if (i > 0 && printedUsersCount > 0) {
            doc.addPage();
        }
        
        printedUsersCount++;

        let startY = M.t;

        doc.setFont('Inter', 'bold');
        doc.setFontSize(14);
        doc.text(user.name.toUpperCase(), M.l, startY);
        const textWidth = doc.getTextWidth(user.name.toUpperCase());
        doc.setDrawColor(0, 0, 0);
        doc.line(M.l, startY + 1, M.l + textWidth, startY + 1);
        startY += 8;


        const tableBody = userTasks
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map(task => {
                const project = allProjects.find(p => p.id === task.projectId);
                const part = project?.parts.find(p => p.id === task.partId);
                return {
                    title: task.title,
                    partName: part?.name || 'N/A',
                    deadline: format(new Date(task.deadline), 'EEEE dd/MM', { locale: es }),
                    dayKey: getDay(new Date(task.deadline))
                };
            });

        autoTable(doc, {
            head: [['Tarea', 'Parte', 'Entrega']],
            body: tableBody.map(t => [t.title, t.partName, t.deadline]),
            startY: startY,
            margin: { left: M.l, right: M.r, bottom: M.b + 10 },
            theme: 'grid',
            headStyles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold' },
            willDrawCell: (data) => {
                if (data.section === 'body') {
                    const task = tableBody[data.row.index];
                    const color = dayColors[task.dayKey];
                    if (color) {
                        doc.setFillColor(color);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    }
                }
            },
        });
    });
    
    if (printedUsersCount === 0) { 
        toast({
            variant: "destructive",
            title: "No hay tareas para esta semana",
            description: "Ninguno de los usuarios seleccionados tiene tareas pendientes para la semana laboral actual.",
        });
        return;
    }

    const totalPages = (doc.internal as any).pages.length || doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        await addPdfFooter(doc, i, totalPages, logoUrl);
    }

    const filename = `Resumen_Tareas_Semanal_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
};

    