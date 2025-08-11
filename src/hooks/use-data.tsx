
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Project, Task, User, Part, Stage, CommonTask } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";


interface DataContextProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
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
  addPartToProject: (projectId: string, partName?: string) => Promise<Part | null>;
  saveCommonDepartment: (departmentName: string) => void;
  saveCommonTask: (task: CommonTask) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [commonDepartments, setCommonDepartments] = useState<string[]>([]);
  const [commonTasks, setCommonTasks] = useState<CommonTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsSnap, tasksSnap, usersSnap, commonDeptSnap, commonTasksSnap] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "tasks")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "commonDepartments")),
          getDocs(collection(db, "commonTasks")),
        ]);

        let projectsData = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        let tasksData = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        let usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const commonDeptData = commonDeptSnap.docs.map(doc => doc.data().name);
        const commonTasksData = commonTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommonTask));

        setProjects(projectsData);
        setTasks(tasksData);
        setUsers(usersData);
        setCommonDepartments(commonDeptData);
        setCommonTasks(commonTasksData);

      } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveCommonDepartment = useCallback(async (departmentName: string) => {
    if (commonDepartments.find(d => d.toLowerCase() === departmentName.toLowerCase())) return;
    const newDocRef = doc(collection(db, "commonDepartments"));
    await setDoc(newDocRef, { name: departmentName });
    setCommonDepartments(prev => [...prev, departmentName]);
  }, [commonDepartments]);
  
  const saveCommonTask = useCallback(async (task: CommonTask) => {
    if (commonTasks.find(t => t.title === task.title)) return;
    const newDocRef = doc(collection(db, "commonTasks"), task.id);
    await setDoc(newDocRef, task);
    setCommonTasks(prev => [...prev, task]);
  }, [commonTasks]);
  
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

  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getTasksByProjectId = useCallback((projectId: string) => tasks.filter(t => t.projectId === projectId), [tasks]);
  const getUsers = useCallback(() => users, [users]);

  const recalculateProjectProgress = useCallback((projectId: string, allTasks: Task[], currentProjects: Project[]) => {
    const projectToRecalculate = currentProjects.find(p => p.id === projectId);
    if (!projectToRecalculate) return currentProjects;

    const projectTasks = allTasks.filter(t => t.projectId === projectId);
    
    // Create a deep copy to avoid direct mutation
    let projectToUpdate = JSON.parse(JSON.stringify(projectToRecalculate));

    const updatedParts = (projectToUpdate.parts || []).map((part: Part) => {
        const partTasks = projectTasks.filter(t => t.partId === part.id);
        
        let newPartProgress = 0;
        if (partTasks.length > 0) {
            const totalPartProgress = partTasks.reduce((acc, task) => acc + task.progress, 0);
            newPartProgress = Math.round(totalPartProgress / partTasks.length);
        }
        
        return { ...part, progress: newPartProgress };
    });

    let newProjectProgress = 0;
    if (updatedParts.length > 0) {
        const totalProjectProgress = updatedParts.reduce((acc: number, part: Part) => acc + (part.progress || 0), 0);
        newProjectProgress = Math.round(totalProjectProgress / updatedParts.length);
    }
    
    const updatedProject = { ...projectToUpdate, parts: updatedParts, progress: newProjectProgress };
    
    return currentProjects.map(p => p.id === projectId ? updatedProject : p);
}, []);


  const saveProject = async (projectData: Omit<Project, 'id'> | Project): Promise<Project> => {
    let updatedProject: Project;
    if ('id' in projectData) {
      updatedProject = { ...projectData };
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } else {
      const newId = doc(collection(db, "projects")).id;
      updatedProject = { ...projectData, id: newId };
      setProjects(prev => [...prev, updatedProject]);
    }
    
    // Create a deep copy for Firestore to avoid issues with custom objects or undefined values
    const projectForDb = JSON.parse(JSON.stringify(updatedProject));
    await setDoc(doc(db, "projects", projectForDb.id), projectForDb);

    return updatedProject;
  };

  const deleteProject = async (projectId: string) => {
    await deleteDoc(doc(db, "projects", projectId));
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // Also delete associated tasks
    const tasksToDelete = tasks.filter(t => t.projectId === projectId);
    const batch = writeBatch(db);
    tasksToDelete.forEach(t => batch.delete(doc(db, "tasks", t.id)));
    await batch.commit();
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
    
    setTasks(currentTasks => {
        let newTasks;
        const taskIndex = currentTasks.findIndex(t => t.id === updatedTask.id);
        if (taskIndex > -1) {
            newTasks = [...currentTasks];
            newTasks[taskIndex] = updatedTask;
        } else {
            newTasks = [...currentTasks, updatedTask];
        }
        
        setProjects(currentProjects => {
             const updatedProjects = recalculateProjectProgress(updatedTask.projectId, newTasks, currentProjects);
             const projectToSave = updatedProjects.find(p => p.id === updatedTask.projectId);
             if (projectToSave) {
                 const projectForDb = JSON.parse(JSON.stringify(projectToSave));
                 setDoc(doc(db, "projects", projectToSave.id), projectForDb);
             }
             return updatedProjects;
        });

        return newTasks;
    });

    const taskForDb = JSON.parse(JSON.stringify(updatedTask));
    await setDoc(doc(db, "tasks", taskForDb.id), taskForDb);

    return updatedTask;
  };
  
  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    await deleteDoc(doc(db, "tasks", taskId));

    setTasks(currentTasks => {
        const newTasks = currentTasks.filter(t => t.id !== taskId);
        
        setProjects(currentProjects => {
            const updatedProjects = recalculateProjectProgress(taskToDelete.projectId, newTasks, currentProjects);
            const projectToSave = updatedProjects.find(p => p.id === taskToDelete.projectId);
            if (projectToSave) {
                const projectForDb = JSON.parse(JSON.stringify(projectToSave));
                setDoc(doc(db, "projects", projectToSave.id), projectForDb);
            }
            return updatedProjects;
       });

        return newTasks;
    });
  };

  const saveUser = async (user: Omit<User, 'id'> | User): Promise<User> => {
    let updatedUser: User;
    if ('id' in user) {
      updatedUser = user;
    } else {
      const newId = doc(collection(db, "users")).id;
      updatedUser = { ...user, id: newId };
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

  const value: DataContextProps = {
    projects,
    tasks,
    users,
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
    addPartToProject,
    saveCommonDepartment,
    saveCommonTask,
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
