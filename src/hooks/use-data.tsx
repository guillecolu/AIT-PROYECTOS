

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Project, Task, User, Part, Stage, CommonTask, AppConfig, UserRole, Attachment, ProjectAlerts, AlertItem } from '@/lib/types';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import * as mime from 'mime-types';
import { startOfDay, addDays, isBefore, endOfDay } from 'date-fns';

interface DataContextProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  userRoles: UserRole[];
  appConfig: AppConfig;
  commonDepartments: string[];
  commonTasks: CommonTask[];
  loading: boolean;
  getProjectById: (id: string) => Project | undefined;
  getTasksByProjectId: (projectId: string) => Task[];
  getUsers: () => User[];
  saveProject: (project: Omit<Project, 'id'> | Project) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  saveTask: (task: Omit<Task, 'id'> | Task) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  saveUser: (user: Omit<User, 'id'> | User) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  saveUserRole: (role: UserRole) => Promise<void>;
  deleteUserRole: (role: UserRole) => Promise<void>;
  addPartToProject: (projectId: string, partName?: string) => Promise<Part | null>;
  addAttachmentToPart: (projectId: string, partId: string, file: File) => Promise<Attachment | null>;
  deleteAttachmentFromPart: (projectId: string, partId: string, attachmentId: string) => Promise<void>;
  saveCommonDepartment: (departmentName: string) => void;
  saveCommonTask: (task: CommonTask) => void;
  deleteCommonTask: (taskId: string) => Promise<void>;
  saveAppConfig: (config: Partial<AppConfig>) => Promise<void>;
  uploadFile: (file: File, path: string, onProgress?: (progress: number) => void) => Promise<string>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ logoUrl: null });
  const [commonDepartments, setCommonDepartments] = useState<string[]>([]);
  const [commonTasks, setCommonTasks] = useState<CommonTask[]>([]);
  const [loading, setLoading] = useState(true);

  const uploadFile = async (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const contentType = mime.lookup(file.name) || 'application/octet-stream';
        const metadata = { contentType };
        
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                console.error("Upload error:", error.code, error.message);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
  }

  const recalculateProjectProgress = (projectId: string, allTasks: Task[]) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
  
    // Create a deep copy to avoid direct mutation
    let projectToUpdate = JSON.parse(JSON.stringify(project));
  
    const projectTasks = allTasks.filter(t => t.projectId === projectId);
  
    const updatedParts = (projectToUpdate.parts || []).map((part: Part) => {
      const partTasks = projectTasks.filter(t => t.partId === part.id);
      let newPartProgress = 0;
      if (partTasks.length > 0) {
        const completedTasks = partTasks.filter(task => task.status === 'finalizada').length;
        newPartProgress = Math.round((completedTasks / partTasks.length) * 100);
      }
      return { ...part, progress: newPartProgress };
    });
  
    let newProjectProgress = 0;
    if (updatedParts.length > 0) {
      const totalProjectProgress = updatedParts.reduce((acc: number, part: Part) => acc + (part.progress || 0), 0);
      newProjectProgress = Math.round(totalProjectProgress / updatedParts.length);
    }
  
    if (projectToUpdate.progress !== newProjectProgress) {
        projectToUpdate = { ...projectToUpdate, parts: updatedParts, progress: newProjectProgress };
        
        setProjects(currentProjects => currentProjects.map(p => p.id === projectId ? projectToUpdate : p));
    }
  };
  

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsSnap, tasksSnap, usersSnap, commonDeptSnap, commonTasksSnap, appConfigSnap, userRolesSnap] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "commonDepartments")),
        getDocs(collection(db, "commonTasks")),
        getDoc(doc(db, "appConfig", "main")),
        getDocs(collection(db, "userRoles")),
      ]);

      let projectsData = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)).sort((a,b) => (a.order || 0) - (b.order || 0));
      let tasksData = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      let usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)).sort((a,b) => (a.order || 0) - (b.order || 0));
      const commonDeptData = commonDeptSnap.docs.map(doc => doc.data().name);
      const commonTasksData = commonTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommonTask));
      const appConfigData = appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : { logoUrl: null };
      const userRolesData = userRolesSnap.docs.map(doc => doc.data().name);

      const defaultRoles = ['Admin', 'Manager', 'Oficina Técnica', 'Taller', 'Eléctrico', 'Comercial', 'Dirección de Proyecto', 'Dirección de Área'];
      const combinedRoles = [...new Set([...defaultRoles, ...userRolesData])];
      
      if (userRolesData.length < defaultRoles.length) {
        const batch = writeBatch(db);
        const rolesToAdd = defaultRoles.filter(role => !userRolesData.includes(role));
        rolesToAdd.forEach(role => {
            const newRoleRef = doc(collection(db, "userRoles"));
            batch.set(newRoleRef, { name: role });
        });
        await batch.commit();
        setUserRoles(combinedRoles);
      } else {
        setUserRoles(userRolesData);
      }
      
      // Simulate backend alert generation for each project
      projectsData = projectsData.map(project => {
          const projectTasks = tasksData.filter(task => task.projectId === project.id);
          const hoy = new Date();
          const comienzoHoy = startOfDay(hoy);
          const proximasLimite = addDays(comienzoHoy, 1);

          const isDone = (task: Task) => task.status === 'finalizada';

          const atrasadas = projectTasks.filter(t => {
            if (isDone(t) || !t.deadline) return false;
            return isBefore(new Date(t.deadline), comienzoHoy);
          });
          
          const proximas = projectTasks.filter(t => {
            if (isDone(t) || !t.deadline) return false;
            const deadlineDate = new Date(t.deadline);
            return deadlineDate >= comienzoHoy && deadlineDate <= proximasLimite;
          });

          const sinAsignar = projectTasks.filter(t => !t.assignedToId && !isDone(t));
          const bloqueadas = projectTasks.filter(t => t.blocked === true && !isDone(t));

          const alerts: ProjectAlerts = {
              id: hoy.toISOString().split('T')[0].replace(/-/g, ''),
              projectId: project.id,
              createdAt: hoy.toISOString(),
              counters: {
                  atrasadas: atrasadas.length,
                  proximas: proximas.length,
                  sinAsignar: sinAsignar.length,
                  bloqueadas: bloqueadas.length,
              },
              items: [
                  ...atrasadas.map(t => ({type: "ATRASADA", taskId: t.id} as AlertItem)),
                  ...proximas.map(t => ({type: "PROXIMA", taskId: t.id} as AlertItem)),
                  ...sinAsignar.map(t => ({type: "SIN_ASIGNAR", taskId: t.id} as AlertItem)),
                  ...bloqueadas.map(t => ({type: "BLOQUEADA", taskId: t.id} as AlertItem)),
              ]
          };
          
          // Recalculate progress based on fetched tasks
          const projectTasksForProgress = tasksData.filter(t => t.projectId === project.id);
          const updatedParts = (project.parts || []).map((part: Part) => {
            const partTasks = projectTasksForProgress.filter(t => t.partId === part.id);
            let newPartProgress = 0;
            if (partTasks.length > 0) {
                const completedTasks = partTasks.filter(task => task.status === 'finalizada').length;
                newPartProgress = Math.round((completedTasks / partTasks.length) * 100);
            }
            return { ...part, progress: newPartProgress };
          });

          let newProjectProgress = 0;
            if (updatedParts.length > 0) {
                const totalProjectProgress = updatedParts.reduce((acc: number, part: Part) => acc + (part.progress || 0), 0);
                newProjectProgress = Math.round(totalProjectProgress / updatedParts.length);
            }


          return { ...project, alerts, parts: updatedParts, progress: newProjectProgress };
      });


      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
      setCommonDepartments(commonDeptData);
      setCommonTasks(commonTasksData);
      setAppConfig(appConfigData);

    } catch (error) {
      console.error("Error fetching data from Firestore: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const saveAppConfig = async (configUpdate: Partial<AppConfig>) => {
    const configRef = doc(db, 'appConfig', 'main');
    const docSnap = await getDoc(configRef);
    const currentConfig = docSnap.exists() ? docSnap.data() : {};
    const newConfig = { ...currentConfig, ...configUpdate };
    
    await setDoc(configRef, newConfig);
    setAppConfig(newConfig as AppConfig);
  };

  const saveCommonDepartment = useCallback(async (departmentName: string) => {
    if (commonDepartments.find(d => d.toLowerCase() === departmentName.toLowerCase())) return;
    const newDocRef = doc(collection(db, "commonDepartments"));
    await setDoc(newDocRef, { name: departmentName });
    setCommonDepartments(prev => [...prev, departmentName]);
  }, [commonDepartments]);
  
  const saveCommonTask = useCallback(async (task: CommonTask) => {
    const taskExists = commonTasks.some(t => 
        t.title.toLowerCase() === task.title.toLowerCase() && 
        t.component.toLowerCase() === task.component.toLowerCase()
    );
    if (taskExists) return;

    const newDocRef = doc(collection(db, "commonTasks"), task.id);
    await setDoc(newDocRef, task);
    setCommonTasks(prev => [...prev, task]);
  }, [commonTasks]);

  const deleteCommonTask = async (taskId: string) => {
    await deleteDoc(doc(db, "commonTasks", taskId));
    setCommonTasks(prev => prev.filter(t => t.id !== taskId));
  };
  
  const addPartToProject = async (projectId: string, partName?: string): Promise<Part | null> => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;

      const newPart: Part = {
          id: crypto.randomUUID(),
          name: partName || `Nuevo Parte ${project.parts?.length || 0 + 1}`,
          stages: [],
          progress: 0,
      };
      
      const updatedProject = { ...project, parts: [...(project.parts || []), newPart] };
      await saveProject(updatedProject);
      
      return newPart;
  };

    const addAttachmentToPart = async (projectId: string, partId: string, file: File): Promise<Attachment | null> => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;

        const currentUser = users.find(u => u.role === "Admin") || users[0];
        if (!currentUser) throw new Error("User not found.");
        
        const safeName = file.name.replace(/[^\\w.\\-]/g, "_");
        const path = `uploads/projects/${projectId}/${partId}/${Date.now()}_${safeName}`;

        try {
            const url = await uploadFile(file, path);
            
            const newAttachment: Attachment = {
                id: crypto.randomUUID(),
                name: file.name,
                url: url,
                path: path,
                size: file.size,
                type: file.type || 'application/octet-stream',
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser.id,
            };

            const updatedParts = (project.parts || []).map(part => {
                if (part.id === partId) {
                    return { ...part, attachments: [...(part.attachments || []), newAttachment] };
                }
                return part;
            });

            const updatedProject = { ...project, parts: updatedParts };
            await saveProject(updatedProject);
            
            setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
            return newAttachment;

        } catch (error) {
            console.error("Error adding attachment:", error);
            throw error; // Re-throw to be caught by the UI
        }
    };
  
    const deleteAttachmentFromPart = async (projectId: string, partId: string, attachmentId: string): Promise<void> => {
       const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const part = project.parts?.find(p => p.id === partId);
        const attachment = part?.attachments?.find(a => a.id === attachmentId);

        if (!attachment) return;

        // Delete from Firebase Storage
        const fileRef = ref(storage, attachment.path);
        await deleteObject(fileRef);

        const updatedParts = project.parts?.map(p => {
            if (p.id === partId) {
                const attachments = p.attachments?.filter(att => att.id !== attachmentId);
                return { ...p, attachments };
            }
            return p;
        });

        const updatedProject = { ...project, parts: updatedParts };
        await saveProject(updatedProject);
        // Optimistic update
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    };

  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getTasksByProjectId = useCallback((projectId: string) => tasks.filter(t => t.projectId === projectId), [tasks]);
  const getUsers = useCallback(() => users, [users]);

  const saveProject = async (projectData: Omit<Project, 'id'> | Project): Promise<Project> => {
    let updatedProject: Project;
    if ('id' in projectData) {
      updatedProject = { ...projectData };
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } else {
      const newId = doc(collection(db, "projects")).id;
      const order = projects.length;
      updatedProject = { ...projectData, id: newId, order };
      setProjects(prev => [...prev, updatedProject]);
    }
    
    // Create a deep copy for Firestore to avoid issues with custom objects or undefined values
    const projectForDb = JSON.parse(JSON.stringify(updatedProject));
    await setDoc(doc(db, "projects", projectForDb.id), projectForDb);

    return updatedProject;
  };

  const deleteProject = async (projectId: string) => {
    const batch = writeBatch(db);

    const projectRef = doc(db, "projects", projectId);
    batch.delete(projectRef);

    const tasksToDelete = tasks.filter(t => t.projectId === projectId);
    tasksToDelete.forEach(t => batch.delete(doc(db, "tasks", t.id)));
      
    await batch.commit();

    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };
  
  const saveTask = async (taskData: Omit<Task, 'id'> | Task): Promise<Task> => {
    let updatedTask: Task;

    if ('id' in taskData) {
        updatedTask = { ...taskData };
    } else {
        const newId = doc(collection(db, "tasks")).id;
        updatedTask = { ...taskData, id: newId } as Task;
    }
    
    const taskForDb = JSON.parse(JSON.stringify(updatedTask));
    await setDoc(doc(db, "tasks", taskForDb.id), taskForDb);

    setTasks(currentTasks => {
        const index = currentTasks.findIndex(t => t.id === updatedTask.id);
        if (index > -1) {
            const newTasks = [...currentTasks];
            newTasks[index] = updatedTask;
            return newTasks;
        }
        return [...currentTasks, updatedTask];
    });

    return updatedTask;
  };
  
  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    await deleteDoc(doc(db, "tasks", taskId));

    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    recalculateProjectProgress(taskToDelete.projectId, newTasks);
  };

  const saveUser = async (user: Omit<User, 'id'> | User): Promise<User> => {
    let updatedUser: User;
    if ('id' in user) {
      updatedUser = user;
    } else {
      const newId = doc(collection(db, "users")).id;
      const order = users.length;
      updatedUser = { ...user, id: newId, order };
    }

    const userForDb = JSON.parse(JSON.stringify(updatedUser));
    await setDoc(doc(db, "users", userForDb.id), userForDb);
    
    setUsers(prev => {
        const userIndex = prev.findIndex(u => u.id === updatedUser.id);
        if (userIndex > -1) {
            const newUsers = [...prev];
            newUsers[userIndex] = updatedUser;
            return newUsers;
        }
        return [...prev, updatedUser];
    });

    return updatedUser;
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    // Unassign tasks from deleted user
    const tasksToUpdate = tasks.filter(t => t.assignedToId === userId);
    const batch = writeBatch(db);
    tasksToUpdate.forEach(task => {
        const taskRef = doc(db, "tasks", task.id);
        batch.update(taskRef, { assignedToId: "" });
    });
    await batch.commit();

    setTasks(prev => prev.map(t => t.assignedToId === userId ? { ...t, assignedToId: '' } : t));
  };
  
  const saveUserRole = async (role: UserRole) => {
    if (userRoles.includes(role)) return;
    await addDoc(collection(db, "userRoles"), { name: role });
    setUserRoles(prev => [...prev, role]);
  };

  const deleteUserRole = async (role: UserRole) => {
      const q = (await getDocs(collection(db, "userRoles"))).docs.find(doc => doc.data().name === role);
      if (q) {
          await deleteDoc(q.ref);
          setUserRoles(prev => prev.filter(r => r !== role));
      }
  };

  const value: DataContextProps = {
    projects,
    tasks,
    users,
    userRoles,
    appConfig,
    commonDepartments,
    commonTasks,
    loading,
    getProjectById,
    getTasksByProjectId,
    getUsers,
    saveProject,
    deleteProject,
    saveTask,
    deleteTask,
    saveUser,
    deleteUser,
    saveUserRole,
    deleteUserRole,
    addPartToProject,
    addAttachmentToPart,
    deleteAttachmentFromPart,
    saveCommonDepartment,
    saveCommonTask,
    deleteCommonTask,
    saveAppConfig,
    uploadFile,
    setProjects,
    setUsers,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

    


    






    


    

    




    