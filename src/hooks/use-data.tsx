

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Project, Task, User, Part, Stage, CommonTask, AppConfig, UserRole, Attachment, ProjectAlerts, AlertItem } from '@/lib/types';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, getDoc, addDoc, updateDoc, onSnapshot, query, Unsubscribe } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import * as mime from 'mime-types';
import { startOfDay, endOfDay, addDays, isBefore } from 'date-fns';

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

  useEffect(() => {
    setLoading(true);

    const processData = (projectsData: Project[], tasksData: Task[]) => {
      return projectsData.map(project => {
        const projectTasks = tasksData.filter(task => task.projectId === project.id);

        const updatedParts = (project.parts || []).map(part => {
          const partTasks = projectTasks.filter(t => t.partId === part.id);
          let newPartProgress = 0;
          if (partTasks.length > 0) {
            const totalTaskProgress = partTasks.reduce((acc, task) => acc + (task.progress || 0), 0);
            newPartProgress = Math.round(totalTaskProgress / partTasks.length);
          }
          return { ...part, progress: newPartProgress };
        });

        let newProjectProgress = 0;
        if (updatedParts.length > 0) {
          const totalProjectProgress = updatedParts.reduce((acc, part) => acc + (part.progress || 0), 0);
          newProjectProgress = Math.round(totalProjectProgress / updatedParts.length);
        }

        return { ...project, parts: updatedParts, progress: newProjectProgress };
      });
    };

    const unsubscribers: Unsubscribe[] = [];

    const projectsQuery = query(collection(db, "projects"));
    const projectsUnsub = onSnapshot(projectsQuery, (querySnapshot) => {
        const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)).sort((a,b) => (a.order || 0) - (b.order || 0));
        setTasks(currentTasks => {
            const updatedProjects = processData(projectsData, currentTasks);
            setProjects(updatedProjects);
            return currentTasks;
        });
    }, (error) => console.error("Projects Snapshot Error:", error));
    unsubscribers.push(projectsUnsub);

    const tasksQuery = query(collection(db, "tasks"));
    const tasksUnsub = onSnapshot(tasksQuery, (querySnapshot) => {
        const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setProjects(currentProjects => {
            const updatedProjects = processData(currentProjects, tasksData);
            setProjects(updatedProjects);
            return currentProjects;
        });
        setTasks(tasksData);
    }, (error) => console.error("Tasks Snapshot Error:", error));
    unsubscribers.push(tasksUnsub);

    const usersQuery = query(collection(db, "users"));
    const usersUnsub = onSnapshot(usersQuery, (querySnapshot) => {
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)).sort((a,b) => (a.order || 0) - (b.order || 0));
        setUsers(usersData);
    }, (error) => console.error("Users Snapshot Error:", error));
    unsubscribers.push(usersUnsub);
    
    const commonDeptQuery = query(collection(db, "commonDepartments"));
    const commonDeptUnsub = onSnapshot(commonDeptQuery, (querySnapshot) => {
        const commonDeptData = querySnapshot.docs.map(doc => doc.data().name);
        setCommonDepartments(commonDeptData);
    }, (error) => console.error("Common Depts Snapshot Error:", error));
    unsubscribers.push(commonDeptUnsub);

    const commonTasksQuery = query(collection(db, "commonTasks"));
    const commonTasksUnsub = onSnapshot(commonTasksQuery, (querySnapshot) => {
        const commonTasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommonTask));
        setCommonTasks(commonTasksData);
    }, (error) => console.error("Common Tasks Snapshot Error:", error));
    unsubscribers.push(commonTasksUnsub);

    const appConfigRef = doc(db, "appConfig", "main");
    const appConfigUnsub = onSnapshot(appConfigRef, (docSnap) => {
        const appConfigData = docSnap.exists() ? docSnap.data() as AppConfig : { logoUrl: null };
        setAppConfig(appConfigData);
    }, (error) => console.error("App Config Snapshot Error:", error));
    unsubscribers.push(appConfigUnsub);

    const userRolesQuery = query(collection(db, "userRoles"));
    const userRolesUnsub = onSnapshot(userRolesQuery, (querySnapshot) => {
        const userRolesData = querySnapshot.docs.map(doc => doc.data().name as UserRole);
        const defaultRoles: UserRole[] = ['Admin', 'Manager', 'Oficina Técnica', 'Taller', 'Eléctrico', 'Comercial', 'Dirección de Proyecto', 'Dirección de Área'];
        const combinedRoles = [...new Set([...defaultRoles, ...userRolesData])];
        
        const rolesToAdd = defaultRoles.filter(role => !userRolesData.includes(role));
        if (rolesToAdd.length > 0) {
            const batch = writeBatch(db);
            rolesToAdd.forEach(role => {
                const newRoleRef = doc(collection(db, "userRoles"));
                batch.set(newRoleRef, { name: role });
            });
            batch.commit();
        }
        setUserRoles(combinedRoles);
    }, (error) => console.error("User Roles Snapshot Error:", error));
    unsubscribers.push(userRolesUnsub);

    setLoading(false);

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
  }, []);
  
  const saveAppConfig = async (configUpdate: Partial<AppConfig>) => {
    const configRef = doc(db, 'appConfig', 'main');
    const docSnap = await getDoc(configRef);
    const currentConfig = docSnap.exists() ? docSnap.data() : {};
    const newConfig = { ...currentConfig, ...configUpdate };
    
    await setDoc(configRef, newConfig, { merge: true });
  };

  const saveCommonDepartment = useCallback(async (departmentName: string) => {
    if (commonDepartments.find(d => d.toLowerCase() === departmentName.toLowerCase())) return;
    const newDocRef = doc(collection(db, "commonDepartments"));
    await setDoc(newDocRef, { name: departmentName });
  }, [commonDepartments]);
  
  const saveCommonTask = useCallback(async (task: CommonTask) => {
    const taskExists = commonTasks.some(t => 
        t.title.toLowerCase() === task.title.toLowerCase() && 
        t.component.toLowerCase() === task.component.toLowerCase()
    );
    if (taskExists) return;

    const newDocRef = doc(collection(db, "commonTasks"), task.id);
    await setDoc(newDocRef, task);
  }, [commonTasks]);

  const deleteCommonTask = async (taskId: string) => {
    await deleteDoc(doc(db, "commonTasks", taskId));
  };
  
  const addPartToProject = async (projectId: string, partName?: string): Promise<Part | null> => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;

      const newPart: Part = {
          id: crypto.randomUUID(),
          name: partName || `Nuevo Parte ${project.parts?.length || 0 + 1}`,
          stages: [],
          progress: 0,
          attachments: []
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
    };

  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getTasksByProjectId = useCallback((projectId: string) => tasks.filter(t => t.projectId === projectId), [tasks]);
  const getUsers = useCallback(() => users, [users]);

  const saveProject = async (projectData: Omit<Project, 'id'> | Project): Promise<Project> => {
    let updatedProject: Project;
    if ('id' in projectData) {
      updatedProject = { ...projectData };
    } else {
      const newId = doc(collection(db, "projects")).id;
      const order = projects.length;
      updatedProject = { ...projectData, id: newId, order };
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

    return updatedTask;
  };
  
  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    await deleteDoc(doc(db, "tasks", taskId));
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

    return updatedUser;
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    
    // Unassign tasks from deleted user
    const tasksToUpdate = tasks.filter(t => t.assignedToId === userId);
    const batch = writeBatch(db);
    tasksToUpdate.forEach(task => {
        const taskRef = doc(db, "tasks", task.id);
        batch.update(taskRef, { assignedToId: "" });
    });
    await batch.commit();
  };
  
  const saveUserRole = async (role: UserRole) => {
    if (userRoles.includes(role)) return;
    await addDoc(collection(db, "userRoles"), { name: role });
  };

  const deleteUserRole = async (role: UserRole) => {
      const q = (await getDocs(collection(db, "userRoles"))).docs.find(doc => doc.data().name === role);
      if (q) {
          await deleteDoc(q.ref);
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

    


    






    


    

    




    


    

