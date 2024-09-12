"use client";

import React, { useState, useEffect, Fragment } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Menu, Transition } from "@headlessui/react";
import { Feature, Task } from "@/types";
import TaskList from "@/components/Task/TaskList";
import AddTaskForm from "@/components/Task/AddTaskForm";

function FeatureItem({
  feature,
  onDuplicate,
  onDelete,
}: {
  feature: Feature;
  onDuplicate: (newFeature: Feature) => void;
  onDelete: (featureId: string) => void;
}) {
  const supabase = createClientComponentClient();
  

  const handleDuplicateFeature = async () => {
    try {
      // Duplicate the feature
      const { data: newFeature, error: featureError } = await supabase
        .from("features")
        .insert({
          name: `${feature.name} (Copy)`,
          project_id: feature.project_id,
          order: feature.order,
          created_at: feature.created_at,
        })
        .select()
        .single();

      if (featureError) throw featureError;

      // Duplicate the tasks
      const tasks = feature.tasks.map((task) => ({
        name: task.name,
        feature_id: newFeature.id,
        progress: task.progress,
        order: task.order,
      }));

      const { error: tasksError } = await supabase.from("tasks").insert(tasks);

      if (tasksError) throw tasksError;

      // Fetch the new feature with its tasks
      const { data: fetchedFeature, error: fetchError } = await supabase
        .from("features")
        .select("*, tasks(*)")
        .eq("id", newFeature.id)
        .single();

      if (fetchError) throw fetchError;

      onDuplicate(fetchedFeature);
    } catch (error) {
      console.error("Error in handleDuplicateFeature:", error);
    }
  };

  const handleDeleteFeature = async () => {
    try {
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("feature_id", feature.id);

      if (tasksError) throw tasksError;

      const { error: featureError } = await supabase
        .from("features")
        .delete()
        .eq("id", feature.id);

      if (featureError) throw featureError;

      onDelete(feature.id);
    } catch (error) {
      console.error("Error in handleDeleteFeature:", error);
    }
  };

  const totalProgress = feature.tasks.reduce((sum, task) => sum + task.progress, 0);
  const totalTasks = feature.tasks.length;
  const totalPossibleProgress = totalTasks * 100;
  const completionPercentage =
    totalTasks > 0 ? Math.round((totalProgress / totalPossibleProgress) * 100) : 0;

  return (
    <div className="min-w-[300px] flex flex-col justify-between w-[300px]  mx-4 my-4 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col justify-start">
        <div className="relative bg-blue-500 h-16 flex flex-row items-center justify-between px-4">
          <div className="z-20 flex items-center space-x-2">
            <div className="bg-white rounded-full px-3 py-1 text-blue-800 font-bold">
              {completionPercentage}%
            </div>
            <h3 className="text-lg font-semibold text-white w-[160px] truncate">
              {feature.name}
            </h3>
          </div>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="text-white hover:bg-blue-800 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDuplicateFeature}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } group flex items-center px-4 py-2 text-sm w-full`}
                      >
                        Duplicate
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteFeature}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } group flex items-center px-4 py-2 text-sm w-full`}
                      >
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          <div
            className="absolute left-0 top-0 bg-blue-800 h-full z-10"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="p-4">
        <TaskList
  tasks={feature.tasks.sort((a, b) => b.order - a.order)} // Sort in descending order by order
  featureId={feature.id}
/>
        </div>
      </div>
      <AddTaskForm featureId={feature.id} />
    </div>
  );
}

export default function FeatureList({
  features,
  projectId,
}: {
  features: Feature[];
  projectId: string;
}) {
  const [orderedFeatures, setOrderedFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    setOrderedFeatures(features.sort((a, b) => a.order - b.order));
  }, [features]);

  const handleDuplicateFeature = (newFeature: Feature) => {
    setOrderedFeatures([...orderedFeatures, newFeature]);
  };

  const handleDeleteFeature = (featureId: string) => {
    setOrderedFeatures(
      orderedFeatures.filter((feature) => feature.id !== featureId)
    );
  };

  return (
    <div className="flex flex-wrap justify-center m-auto">
      {orderedFeatures.map((feature) => (
        <FeatureItem
          key={feature.id}
          feature={feature}
          onDuplicate={handleDuplicateFeature}
          onDelete={handleDeleteFeature}
        />
      ))}
    </div>
  );
}
